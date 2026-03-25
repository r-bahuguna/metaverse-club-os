import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { validateSlRequest, checkRateLimit } from '@/lib/sl-security';

/**
 * POST /api/sl/dj-status
 *
 * Receives DJ login/logout/track-change events from SL DJ Board objects.
 * Updates Firestore for real-time dashboard DJ booth display.
 *
 * Expected JSON body from LSL:
 * {
 *   "type": "dj_status",
 *   "djUuid": "username" (SL legacy name),
 *   "djName": "DJ Rahul",
 *   "streamUrl": "http://...",
 *   "genre": "EDM",
 *   "event": "login" | "logout" | "track_change",
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
            djUuid,
            djName,
            streamUrl = '',
            genre = '',
            event: eventType,
            timestamp,
            region,
        } = body;

        if (!djUuid || !djName || !eventType) {
            return NextResponse.json(
                { error: 'Missing required fields: djUuid, djName, event' },
                { status: 400 }
            );
        }

        const adminDb = getAdminDb();
        const orgId = validation.clubId || 'default';
        const activeDjRef = adminDb.doc(`orgs/${orgId}/active_state/dj`);

        if (eventType === 'login') {
            // ── DJ goes live ──
            await activeDjRef.set({
                djUuid,
                djName,
                streamUrl,
                genre,
                isLive: true,
                loginAt: new Date(),
                region: region || validation.context?.region || '',
            });

            // ── Log session start ──
            await adminDb.collection(`orgs/${orgId}/dj_sessions`).add({
                djUuid,
                djName,
                streamUrl,
                genre,
                eventType: 'login',
                timestamp: new Date(),
                region: region || '',
            });

        } else if (eventType === 'logout') {
            // ── DJ signs off ──
            const currentSnap = await activeDjRef.get();
            const currentDj = currentSnap.data();

            await activeDjRef.set({
                isLive: false,
                lastDj: djName,
                logoutAt: new Date(),
            });

            // ── Log session end ──
            await adminDb.collection(`orgs/${orgId}/dj_sessions`).add({
                djUuid,
                djName,
                streamUrl: '',
                genre: currentDj?.genre || genre,
                eventType: 'logout',
                timestamp: new Date(),
                sessionMinutes: currentDj?.loginAt
                    ? Math.round((Date.now() - currentDj.loginAt.toDate().getTime()) / 60000)
                    : 0,
                region: region || '',
            });

        } else if (eventType === 'track_change') {
            // ── Track changed — update current track info ──
            await activeDjRef.update({
                currentTrack: body.track || '',
                lastTrackChange: new Date(),
            });
        }

        // ── Minimal response ──
        return NextResponse.json({ ok: true });

    } catch (error: unknown) {
        console.error('DJ status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
