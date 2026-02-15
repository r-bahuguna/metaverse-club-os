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

    // 1. Strip surrounding quotes if present
    if (key.startsWith('"') && key.endsWith('"')) {
        key = key.slice(1, -1);
    }

    if (key.startsWith('{')) {
        // Case A: Full Service Account JSON
        try {
            const serviceAccount = JSON.parse(key);
            credential = cert(serviceAccount);
        } catch (error) {
            console.error('Failed to parse FIREBASE_ADMIN_PRIVATE_KEY as JSON', error);
            throw new Error('Invalid JSON in FIREBASE_ADMIN_PRIVATE_KEY');
        }
    } else {
        // Case B: PEM String
        // First, unescape any literal "\n" characters
        let privateKey = key.replace(/\\n/g, '\n');

        // HANDLING "ONE-LINER" KEYS (Common Copy-Paste Issue)
        // If the environment/secret manager stripped all newlines, we must reconstruct the PEM structure.
        if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            const header = '-----BEGIN PRIVATE KEY-----';
            const footer = '-----END PRIVATE KEY-----';

            // Extract body, remove spaces, and reconstruct
            let body = privateKey.replace(header, '').replace(footer, '').trim();
            body = body.replace(/ /g, ''); // Remove spaces inside base64 body

            privateKey = `${header}\n${body}\n${footer}`;
        }

        credential = cert({
            projectId,
            clientEmail,
            privateKey,
        });
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
