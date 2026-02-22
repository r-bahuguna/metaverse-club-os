/* ==========================================================================
   POST /api/update-user
   Server-side: updates Firestore user doc + Auth custom claims.
   Only callable by authenticated users with manager+ role.
   ========================================================================== */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const ALLOWED_ROLES = ['super_admin', 'owner', 'general_manager', 'manager'];

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
        const { uid, displayName, slName, slUuid, discordUsername, role, secondaryRoles } = body;

        if (!uid) {
            return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
        }

        // Build update object (only include fields that were provided)
        const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
        if (displayName !== undefined) updateData.displayName = displayName;
        if (slName !== undefined) updateData.slName = slName;
        if (slUuid !== undefined) updateData.slUuid = slUuid;
        if (discordUsername !== undefined) updateData.discordUsername = discordUsername;
        if (role !== undefined) updateData.role = role;
        if (secondaryRoles !== undefined) updateData.secondaryRoles = secondaryRoles;

        // Update Firestore doc
        await adminDb.collection('users').doc(uid).update(updateData);

        // Update Auth custom claims if role changed
        if (role !== undefined) {
            await adminAuth.setCustomUserClaims(uid, { role });
        }

        // Update Auth display name if changed
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
