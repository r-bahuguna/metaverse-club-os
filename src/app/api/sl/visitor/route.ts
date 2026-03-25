import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { validateSlRequest, checkRateLimit } from '@/lib/sl-security';

/**
 * POST /api/sl/visitor
 *
 * Receives visitor arrival/departure events from SL Visitor Tracker objects.
 * Stores in Firestore for real-time guest list display.
 *
 * Expected JSON body from LSL:
 * {
 *   "type": "visitor",
 *   "avatarUuid": "...",
 *   "avatarName": "...",
 *   "event": "arrival" | "departure",
 *   "isNew": 0 | 1,
 *   "dwellMinutes": 45,
 *   "currentCount": 12,
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

        // ── Rate limit ──
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
            avatarUuid,
            avatarName,
            event: eventType,
            isNew = 0,
            dwellMinutes,
            currentCount,
            timestamp,
            region,
        } = body;

        if (!avatarUuid || !avatarName || !eventType) {
            return NextResponse.json(
                { error: 'Missing required fields: avatarUuid, avatarName, event' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const orgId = validation.clubId || 'default';

        if (eventType === 'arrival') {
            // ── Add to live visitors collection ──
            await adminDb.collection(`orgs/${orgId}/visitors_live`).doc(avatarUuid).set({
                avatarUuid,
                avatarName,
                arrivedAt: new Date(),
                isNew: Boolean(parseInt(String(isNew), 10)),
                region: region || validation.context?.region || '',
            });

            // ── Update tonight's stats ──
            const statsRef = adminDb.doc(`orgs/${orgId}/stats/tonight`);
            const statsSnap = await statsRef.get();
            const current = statsSnap.data() || {};
            const newCount = parseInt(String(currentCount), 10) || (current.currentVisitors || 0) + 1;

            await statsRef.set({
                ...current,
                currentVisitors: newCount,
                totalVisitors: (current.totalVisitors || 0) + 1,
                newVisitors: (current.newVisitors || 0) + (parseInt(String(isNew), 10) ? 1 : 0),
                peakConcurrent: Math.max(current.peakConcurrent || 0, newCount),
            }, { merge: true });

        } else if (eventType === 'departure') {
            // ── Remove from live visitors ──
            await adminDb.collection(`orgs/${orgId}/visitors_live`).doc(avatarUuid).delete();

            // ── Update current count ──
            const statsRef = adminDb.doc(`orgs/${orgId}/stats/tonight`);
            const statsSnap = await statsRef.get();
            const current = statsSnap.data() || {};
            const newCount = parseInt(String(currentCount), 10) || Math.max(0, (current.currentVisitors || 1) - 1);

            await statsRef.update({
                currentVisitors: newCount,
            });

            // ── Log the visit with dwell time ──
            await adminDb.collection(`orgs/${orgId}/visitor_log`).add({
                avatarUuid,
                avatarName,
                dwellMinutes: parseInt(String(dwellMinutes), 10) || 0,
                isNew: Boolean(parseInt(String(isNew), 10)),
                region: region || '',
                timestamp: new Date(),
            });
        }

        // ── Minimal response for SL 2KB limit ──
        return NextResponse.json({ ok: true });

    } catch (error: unknown) {
        console.error('Visitor tracking error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
