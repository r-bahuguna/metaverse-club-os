/* ==========================================================================
   POST /api/update-user
   Server-side: updates Firestore user doc + Auth custom claims.
   Only callable by authenticated users with manager+ role.
   Supports: profile edit, role change (with protection), deactivation.
   ========================================================================== */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const ALLOWED_ROLES = ['super_admin', 'owner', 'general_manager', 'manager'];
const PROTECTED_ROLES = ['owner', 'super_admin'];

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();

        const decoded = await adminAuth.verifyIdToken(token);
        const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
        const callerRole = callerDoc.data()?.role;
        if (!callerRole || !ALLOWED_ROLES.includes(callerRole)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await req.json();
        const { uid, displayName, slName, slUuid, discordUsername, role, secondaryRoles, action } = body;

        if (!uid) {
            return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
        }

        // Fetch target user's current data
        const targetDoc = await adminDb.collection('users').doc(uid).get();
        if (!targetDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const targetData = targetDoc.data()!;
        const targetCurrentRole = targetData.role;

        /* ─── DEACTIVATION FLOW ─── */
        if (action === 'deactivate') {
            if (PROTECTED_ROLES.includes(targetCurrentRole)) {
                return NextResponse.json({ error: 'Cannot deactivate owner or super admin' }, { status: 403 });
            }
            if (uid === decoded.uid) {
                return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
            }

            await adminDb.collection('users').doc(uid).update({
                status: 'deactivated',
                deactivatedAt: new Date().toISOString(),
            });
            await adminAuth.updateUser(uid, { disabled: true });

            // Unassign from future events
            const today = new Date().toISOString().split('T')[0];
            const eventsSnap = await adminDb.collection('events')
                .where('date', '>=', today).get();
            const batch = adminDb.batch();
            for (const eventDoc of eventsSnap.docs) {
                const data = eventDoc.data();
                const updates: Record<string, string> = {};
                if (data.djId === uid) { updates.djId = ''; updates.djName = ''; updates.djResponse = ''; }
                if (data.hostId === uid) { updates.hostId = ''; updates.hostName = ''; updates.hostResponse = ''; }
                if (Object.keys(updates).length > 0) batch.update(eventDoc.ref, updates);
            }
            await batch.commit();
            return NextResponse.json({ success: true, action: 'deactivated' });
        }

        /* ─── REACTIVATION FLOW ─── */
        if (action === 'reactivate') {
            await adminDb.collection('users').doc(uid).update({ status: 'active', deactivatedAt: '' });
            await adminAuth.updateUser(uid, { disabled: false });
            return NextResponse.json({ success: true, action: 'reactivated' });
        }

        /* ─── ROLE CHANGE VALIDATION ─── */
        if (role !== undefined && role !== targetCurrentRole) {
            if (targetCurrentRole === 'owner' && callerRole !== 'super_admin') {
                return NextResponse.json({ error: 'Only super admin can modify the owner role' }, { status: 403 });
            }
            if (role === 'owner' && !['owner', 'super_admin'].includes(callerRole)) {
                return NextResponse.json({ error: 'Only owner or super admin can transfer ownership' }, { status: 403 });
            }
            if ((targetCurrentRole === 'super_admin' || role === 'super_admin') && callerRole !== 'super_admin') {
                return NextResponse.json({ error: 'Only super admin can modify super admin roles' }, { status: 403 });
            }
            const hierarchy = ['member', 'vip_member', 'host', 'dj', 'manager', 'general_manager', 'owner', 'super_admin'];
            const callerLevel = hierarchy.indexOf(callerRole);
            const targetNewLevel = hierarchy.indexOf(role);
            if (targetNewLevel > callerLevel) {
                return NextResponse.json({ error: 'Cannot promote above your own role level' }, { status: 403 });
            }
        }

        /* ─── PROFILE UPDATE ─── */
        const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
        if (displayName !== undefined) updateData.displayName = displayName;
        if (slName !== undefined) updateData.slName = slName;
        if (slUuid !== undefined) updateData.slUuid = slUuid;
        if (discordUsername !== undefined) updateData.discordUsername = discordUsername;
        if (role !== undefined) updateData.role = role;
        if (secondaryRoles !== undefined) updateData.secondaryRoles = secondaryRoles;

        await adminDb.collection('users').doc(uid).update(updateData);

        if (role !== undefined) {
            await adminAuth.setCustomUserClaims(uid, { role });
        }
        if (displayName !== undefined) {
            await adminAuth.updateUser(uid, { displayName });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[update-user] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
