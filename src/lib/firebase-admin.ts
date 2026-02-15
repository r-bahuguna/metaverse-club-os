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
        // Case B: PEM String or "One-Liner"
        let privateKey = key.replace(/\\n/g, '\n');

        // Robust parsing using indexOf (avoid regex pitfalls with hyphens/newlines)
        const header = '-----BEGIN PRIVATE KEY-----';
        const footer = '-----END PRIVATE KEY-----';

        if (privateKey.includes(header) && privateKey.includes(footer)) {
            // Extract the body between header and footer
            const start = privateKey.indexOf(header) + header.length;
            const end = privateKey.lastIndexOf(footer);
            let body = privateKey.substring(start, end);

            // Remove ALL whitespace (spaces, tabs, newlines)
            body = body.replace(/\s/g, '');

            // FIX URL-SAFE BASE64 characters
            // Google sometimes provides keys with '-' and '_' instead of '+' and '/'
            if (body.includes('-') || body.includes('_')) {
                body = body.replace(/-/g, '+').replace(/_/g, '/');
            }

            // Reconstruct perfectly standard PEM
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
