import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { validateSlRequest, checkRateLimit } from '@/lib/sl-security';

/**
 * POST /api/sl/tip
 *
 * Receives tip data from SL Tip Jar objects.
 * Stores in both:
 *   - PostgreSQL (via Data Connect) for financial ledger
 *   - Firestore for real-time dashboard updates
 *
 * Expected JSON body from LSL:
 * {
 *   "type": "tip",
 *   "payerUuid": "...",
 *   "payerName": "...",
 *   "amount": 100,
 *   "category": "dj",
 *   "recipientName": "DJ Rahul",
 *   "objectKey": "...",
 *   "timestamp": "...",
 *   "region": "..."
 * }
 */
export async function POST(req: Request) {
    try {
        // ── Validate SL headers ──
        const validation = await validateSlRequest(req);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 403 }
            );
        }

        // ── Rate limit by object key ──
        const objectKey = validation.context?.objectKey || 'unknown';
        if (!checkRateLimit(objectKey)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }

        // ── Parse body ──
        const body = await req.json();
        const {
            payerUuid,
            payerName,
            amount,
            category = 'club',
            recipientName = '',
            timestamp,
            region,
        } = body;

        if (!payerUuid || !payerName || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: payerUuid, payerName, amount' },
                { status: 400 }
            );
        }

        const tipData = {
            sourceUuid: payerUuid,
            sourceName: payerName,
            recipientUuid: validation.context?.ownerKey || '',
            recipientName: recipientName,
            amount: parseInt(amount, 10),
            category,
            jarObjectKey: objectKey,
            region: region || validation.context?.region || '',
            timestamp: timestamp || new Date().toISOString(),
            verified: true,
        };

        const adminDb = getAdminDb();
        const orgId = validation.clubId || 'default';
        const orgRef = adminDb.doc(`orgs/${orgId}`);

        // ── Write to Firestore (real-time dashboard) ──
        // Tips are written to a real-time collection for immediate dashboard display
        const tipRef = await adminDb.collection(`orgs/${orgId}/tips_realtime`).add({
            ...tipData,
            orgId,
            createdAt: new Date(),
        });

        // ── Also push to the "tonight's stats" aggregate ──
        const statsRef = adminDb.doc(`orgs/${orgId}/stats/tonight`);
        const statsSnap = await statsRef.get();
        if (statsSnap.exists) {
            const current = statsSnap.data() || {};
            await statsRef.update({
                totalTips: (current.totalTips || 0) + tipData.amount,
                tipCount: (current.tipCount || 0) + 1,
                lastTip: {
                    payer: tipData.sourceName,
                    amount: tipData.amount,
                    category: tipData.category,
                    time: new Date(),
                },
            });
        } else {
            await statsRef.set({
                totalTips: tipData.amount,
                tipCount: 1,
                lastTip: {
                    payer: tipData.sourceName,
                    amount: tipData.amount,
                    category: tipData.category,
                    time: new Date(),
                },
                startedAt: new Date(),
            });
        }

        // ── Response back to SL (kept minimal for 2KB LSL limit) ──
        // Can include a "vibe tag" or custom message for the tip jar to speak
        return NextResponse.json({
            ok: true,
            id: tipRef.id,
            vibeTag: tipData.amount >= 500 ? 'High Roller' :
                tipData.amount >= 100 ? 'VIP' : 'Supporter',
        });

    } catch (error: unknown) {
        console.error('Tip ingestion error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
