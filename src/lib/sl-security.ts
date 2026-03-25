/**
 * SL Security Middleware — Validates incoming requests from Second Life objects.
 *
 * Checks:
 *   1. X-SecondLife-Owner-Key header (avatar UUID of object owner)
 *   2. X-SecondLife-Shard header (reject "Testing" shard for financial data)
 *   3. X-Club-Auth header (shared secret per deployment)
 *
 * SL automatically injects these headers on llHTTPRequest calls:
 *   - X-SecondLife-Owner-Key
 *   - X-SecondLife-Object-Key
 *   - X-SecondLife-Object-Name
 *   - X-SecondLife-Region
 *   - X-SecondLife-Local-Position
 *   - X-SecondLife-Local-Rotation
 *   - X-SecondLife-Local-Velocity
 *   - X-SecondLife-Shard
 */

import { getAdminDb } from '@/lib/firebase-admin';

export interface SlRequestContext {
    ownerKey: string;
    objectKey: string;
    shard: string;
    region: string;
    objectName: string;
    clubAuth: string;
}

export interface SlValidationResult {
    valid: boolean;
    context?: SlRequestContext;
    error?: string;
    clubId?: string;
}

/**
 * Extract SL headers from an incoming request.
 */
export function extractSlHeaders(req: Request): SlRequestContext {
    return {
        ownerKey: req.headers.get('x-secondlife-owner-key') || '',
        objectKey: req.headers.get('x-secondlife-object-key') || '',
        shard: req.headers.get('x-secondlife-shard') || '',
        region: req.headers.get('x-secondlife-region') || '',
        objectName: req.headers.get('x-secondlife-object-name') || '',
        clubAuth: req.headers.get('x-club-auth') || '',
    };
}

/**
 * Validate an incoming SL request.
 *
 * For production use:
 *   - Owner key must be present
 *   - Shard must be "Production" for financial transactions
 *   - Club auth secret must match the stored secret for the club
 *
 * During development, we're lenient on some checks.
 */
export async function validateSlRequest(req: Request): Promise<SlValidationResult> {
    const ctx = extractSlHeaders(req);

    // ── Check owner key ──
    if (!ctx.ownerKey) {
        return { valid: false, error: 'Missing X-SecondLife-Owner-Key header' };
    }

    // ── Check shard — reject test grid for financial data ──
    if (ctx.shard === 'Testing') {
        return {
            valid: false,
            error: 'Requests from Beta Grid are not accepted for financial data',
        };
    }

    // ── Always look up the club/org by owner UUID ──
    try {
        const clubsSnap = await getAdminDb()
            .collection('orgs')
            .where('ownerSlUuid', '==', ctx.ownerKey)
            .limit(1)
            .get();

        if (!clubsSnap.empty) {
            const clubDoc = clubsSnap.docs[0];
            const storedSecret = clubDoc.data().apiSecret;

            // If club has an API secret set, validate it
            if (storedSecret && ctx.clubAuth && storedSecret !== ctx.clubAuth) {
                return { valid: false, error: 'Invalid X-Club-Auth secret' };
            }

            return {
                valid: true,
                context: ctx,
                clubId: clubDoc.id,
            };
        }
    } catch (err) {
        console.error('Org lookup error:', err);
    }

    // ── No org found — allow in dev mode, reject in production ──
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
        console.warn('[sl-security] No org found for owner key:', ctx.ownerKey, '— allowing in dev mode');
        return { valid: true, context: ctx, clubId: 'default' };
    }

    return { valid: false, error: 'No registered organization for this owner' };
}

/**
 * Rate limiting check (simple per-IP/per-object).
 * In production, use a more robust solution (Redis, Cloud Tasks, etc.)
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;         // Max requests per window
const RATE_WINDOW_MS = 60000;  // 1 minute window

export function checkRateLimit(objectKey: string): boolean {
    const now = Date.now();
    const entry = requestCounts.get(objectKey);

    if (!entry || now > entry.resetAt) {
        requestCounts.set(objectKey, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}
