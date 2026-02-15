/* ==========================================================================
   POST /api/create-user
   Server-side: creates Firebase Auth user + Firestore user doc.
   Only callable by authenticated users with manager+ role.
   ========================================================================== */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
}

const ALLOWED_ROLES = ['super_admin', 'owner', 'general_manager', 'manager'];

export async function POST(req: NextRequest) {
    try {
        /* ── Auth check: verify the caller's token ── */
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const adminAuth = getAdminAuth(); // Lazy init
        const adminDb = getAdminDb();     // Lazy init

        const decoded = await adminAuth.verifyIdToken(token);

        // Look up the caller's role from Firestore
        const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
        const callerRole = callerDoc.data()?.role;
        if (!callerRole || !ALLOWED_ROLES.includes(callerRole)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        /* ── Parse request body ── */
        const body = await req.json();
        const { displayName, slName, slUuid, role, secondaryRoles } = body;

        if (!displayName || !slName || !role) {
            return NextResponse.json({ error: 'Missing required fields: displayName, slName, role' }, { status: 400 });
        }

        const validStaffRoles = ['general_manager', 'manager', 'dj', 'host'];
        if (!validStaffRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role. Must be one of: ' + validStaffRoles.join(', ') }, { status: 400 });
        }

        // Check if slName already exists
        const existing = await adminDb.collection('users').where('slName', '==', slName).get();
        if (!existing.empty) {
            return NextResponse.json({ error: 'A user with this SL name already exists' }, { status: 409 });
        }

        /* ── Create Firebase Auth user ── */
        const internalEmail = `${slName.toLowerCase().replace(/\s+/g, '.')}@riskydesires.internal`;
        const tempPassword = generateTempPassword();

        const authUser = await adminAuth.createUser({
            email: internalEmail,
            password: tempPassword,
            displayName: displayName,
        });

        // Set custom claims for Role-Based Access Control (RBAC) in Security Rules
        await adminAuth.setCustomUserClaims(authUser.uid, { role });

        /* ── Create Firestore user document ── */
        const now = new Date().toISOString();
        const userData = {
            uid: authUser.uid,
            email: internalEmail,
            displayName,
            slName,
            slUuid: slUuid || '',
            role,
            secondaryRoles: secondaryRoles || [],
            mustChangePassword: true,
            createdAt: now,
            createdBy: decoded.uid,
            onlineStatus: 'offline',
        };

        await adminDb.collection('users').doc(authUser.uid).set(userData);

        return NextResponse.json({
            success: true,
            uid: authUser.uid,
            tempPassword,
            displayName,
            slName,
            role,
            secondaryRoles,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[create-user] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
