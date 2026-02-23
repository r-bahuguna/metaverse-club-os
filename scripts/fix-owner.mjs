#!/usr/bin/env node
/* ==========================================================================
   fix-owner.mjs — Set a user's role to 'owner' in Firestore + Auth claims.
   
   Usage:  node scripts/fix-owner.mjs <UID>
   Reads credentials from .env.local
   ========================================================================== */

import { readFileSync } from 'fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Parse .env.local
function loadEnv() {
    try {
        const content = readFileSync('.env.local', 'utf-8');
        const env = {};
        for (const line of content.split('\n')) {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
                let val = match[2].trim();
                // Strip surrounding quotes
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                env[match[1].trim()] = val;
            }
        }
        return env;
    } catch {
        console.error('❌ Could not read .env.local');
        process.exit(1);
    }
}

const uid = process.argv[2];
if (!uid) {
    console.error('Usage: node scripts/fix-owner.mjs <UID>');
    process.exit(1);
}

const env = loadEnv();
const projectId = env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing FIREBASE_ADMIN_* env vars in .env.local');
    process.exit(1);
}

if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
}

const auth = getAuth();
const db = getFirestore();

async function fixOwner() {
    console.log(`\n🔧 Setting ${uid} as owner...\n`);

    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
        console.error(`❌ User ${uid} not found in Firestore!`);
        process.exit(1);
    }

    const data = snap.data();
    console.log(`   Found: ${data.displayName} (current role: ${data.role})`);

    await userRef.update({ role: 'owner', updatedAt: new Date().toISOString() });
    console.log(`   ✅ Firestore role → owner`);

    await auth.setCustomUserClaims(uid, { role: 'owner' });
    console.log(`   ✅ Auth custom claims → { role: 'owner' }`);

    const updatedDoc = await userRef.get();
    const updatedUser = await auth.getUser(uid);
    console.log(`\n   📋 Verification:`);
    console.log(`      Firestore role: ${updatedDoc.data().role}`);
    console.log(`      Auth claims: ${JSON.stringify(updatedUser.customClaims)}`);
    console.log(`      Display name: ${updatedDoc.data().displayName}`);
    console.log(`\n✅ Done! ${data.displayName} is now the Owner.\n`);
}

fixOwner().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
