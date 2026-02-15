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

    // --- SAFE DIAGNOSTIC LOGGING ---
    // We log the STRUCTURE of the key, but never the key content itself.
    const keyLen = privateKeyRaw.length;
    const startObj = privateKeyRaw.substring(0, 10);
    const endObj = privateKeyRaw.substring(keyLen - 10);
    const newlineCount = (privateKeyRaw.match(/\n/g) || []).length;
    const escapedNewlineCount = (privateKeyRaw.match(/\\n/g) || []).length;

    console.log(`[DIAGNOSTIC] Key Length: ${keyLen}`);
    // Replace characters with * to be safe, but keep the structural hints
    console.log(`[DIAGNOSTIC] Starts with: '${startObj}'`);
    console.log(`[DIAGNOSTIC] Ends with: '${endObj}'`);
    console.log(`[DIAGNOSTIC] Newlines (\\n literal): ${escapedNewlineCount}`);
    console.log(`[DIAGNOSTIC] Newlines (actual): ${newlineCount}`);
    // -------------------------------

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
            // Fallback: maybe it was just a string starting with {? Unlikely but safe to fail hard here if it looked like JSON.
            throw new Error('Invalid JSON in FIREBASE_ADMIN_PRIVATE_KEY');
        }
    } else {
        // Case B: Standard PEM string
        // We MUST unescape newlines here (e.g. \n -> actual newline) for PEM format
        const privateKey = key.replace(/\\n/g, '\n');
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
