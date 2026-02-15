/* ==========================================================================
   Firebase Admin SDK — Server-side only
   Used by API routes for privileged operations (creating users, etc.)
   ========================================================================== */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

function getAdminApp(): App {
    if (adminApp) return adminApp;

    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
        throw new Error('Missing FIREBASE_ADMIN_* environment variables');
    }

    let credential;

    // Robust handling: User might paste the full JSON file OR just the PEM key
    // AND it might be wrapped in quotes by the environment/secret manager.

    let key = privateKeyRaw.trim();

    // 1. Strip surrounding quotes if present (simple case)
    if (key.startsWith('"') && key.endsWith('"')) {
        key = key.slice(1, -1);
    }

    // --- DIAGNOSTICS (Safe: First 10 chars only) ---
    // This helps us know if we are getting JSON or PEM or garbage
    console.log(`[DIAGNOSTIC] Key Length: ${key.length}`);
    console.log(`[DIAGNOSTIC] First 10 chars: '${key.substring(0, 10)}'`);
    // -----------------------------------------------

    // Strategy 1: Smart JSON Detection
    // It might be a full JSON service account object, but maybe wrapped in quotes or whitespace.
    // We look for specific JSON keys.
    if (key.includes('"private_key"') || key.includes('private_key_id')) {
        console.log('[DIAGNOSTIC] Detected JSON-like content.');
        try {
            // Attempt to find the actual JSON object block `{ ... }`
            // This handles cases like: export KEY='{...}' or similar wrappers
            const jsonMatch = key.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const serviceAccount = JSON.parse(jsonMatch[0]);
                credential = cert(serviceAccount);
            } else {
                // Fallback: try parsing the whole string
                const serviceAccount = JSON.parse(key);
                credential = cert(serviceAccount);
            }
        } catch (error) {
            console.error('[DIAGNOSTIC] JSON parsing failed, falling back to RSA Key Search.', error);
        }
    }

    // Strategy 2: RSA Private Key Body Search (MII Pattern)
    // If it wasn't JSON (or failed to parse), we look for the PEM body directly.
    // RSA 2048-bit keys start with "MII" in Base64.
    if (!credential) {
        console.log('[DIAGNOSTIC] Attempting RSA Key Body Extraction (MII pattern)...');

        // Remove ALL whitespace to make regex matching reliable across lines
        const cleanKey = key.replace(/\s/g, '');

        // Regex Look for: MII... (at least 100 chars of base64)
        // This bypasses any header/footer issues completely.
        const rsaMatch = cleanKey.match(/(MII[a-zA-Z0-9\-_+/=]{100,})/);

        if (rsaMatch) {
            let body = rsaMatch[0];
            console.log(`[DIAGNOSTIC] Found RSA Body. Length: ${body.length}`);

            // Fix URL-Safe chars if present (Google sometimes uses - and _)
            if (body.includes('-') || body.includes('_')) {
                body = body.replace(/-/g, '+').replace(/_/g, '/');
            }

            const privateKey = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
            credential = cert({
                projectId,
                clientEmail,
                privateKey,
            });
        } else {
            // Fallback: The user might have provided a key that DOESN'T start with MII (rare for RSA)
            // or we couldn't find it. We pass it as-is with naive newline fix.
            console.warn('[DIAGNOSTIC] Could not find MII pattern. Using raw key with newline fixes.');
            credential = cert({
                projectId,
                clientEmail,
                privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
            });
        }
    }

    try {
        adminApp = initializeApp({
            credential,
            projectId, // Explicitly pass projectId to ensure app context
        });
        return adminApp;
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
        throw error;
    }
}

export function getAdminAuth() {
    const app = getAdminApp();
    return getAuth(app);
}

export function getAdminDb() {
    const app = getAdminApp();
    return getFirestore(app);
}
