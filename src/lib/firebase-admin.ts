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
    const privateKeyEnv = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyEnv) {
        throw new Error('Missing FIREBASE_ADMIN_* environment variables');
    }

    // The private key env var should contain the PEM string with literal \n
    // Cloud Run / App Hosting injects it correctly — just convert escaped newlines.
    const privateKey = privateKeyEnv.replace(/\\n/g, '\n');

    const credential = cert({ projectId, clientEmail, privateKey });

    try {
        adminApp = initializeApp({ credential, projectId });
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
