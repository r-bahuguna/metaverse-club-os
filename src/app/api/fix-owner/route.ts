/* ==========================================================================
   POST /api/fix-owner
   One-time admin endpoint to fix Levi's role to 'owner'.
   Only callable by super_admin.
   ========================================================================== */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

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

        if (callerRole !== 'super_admin') {
            return NextResponse.json({ error: 'Only super admin can use this endpoint' }, { status: 403 });
        }

        const body = await req.json();
        const { uid } = body;
        if (!uid) {
            return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
        }

        // Update Firestore
        await adminDb.collection('users').doc(uid).update({
            role: 'owner',
            updatedAt: new Date().toISOString(),
        });

        // Update Auth custom claims
        await adminAuth.setCustomUserClaims(uid, { role: 'owner' });

        // Update Auth display name (if needed)
        const targetDoc = await adminDb.collection('users').doc(uid).get();
        const targetName = targetDoc.data()?.displayName || 'Unknown';

        return NextResponse.json({
            success: true,
            message: `${targetName} is now the Owner`,
            uid,
            role: 'owner',
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[fix-owner] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
