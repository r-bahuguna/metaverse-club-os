#!/usr/bin/env node
/* ==========================================================================
   fix-owner.mjs — Run from Cloud Shell to set Levi's role to owner.
   
   Usage:
     node scripts/fix-owner.mjs <LEVI_UID>
   
   Requires: GOOGLE_APPLICATION_CREDENTIALS or default GCP credentials.
   ========================================================================== */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const uid = process.argv[2];
if (!uid) {
    console.error('Usage: node scripts/fix-owner.mjs <LEVI_UID>');
    process.exit(1);
}

// Initialize with default credentials (Cloud Shell provides these)
if (!getApps().length) {
    initializeApp({ projectId: 'risky-desires' });
}

const auth = getAuth();
const db = getFirestore();

async function fixOwner() {
    console.log(`\n🔧 Setting ${uid} as owner...\n`);

    // 1. Update Firestore
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
        console.error(`❌ User ${uid} not found in Firestore!`);
        process.exit(1);
    }

    const data = snap.data();
    console.log(`   Found: ${data.displayName} (current role: ${data.role})`);

    await userRef.update({
        role: 'owner',
        updatedAt: new Date().toISOString(),
    });
    console.log(`   ✅ Firestore role → owner`);

    // 2. Update Auth custom claims
    await auth.setCustomUserClaims(uid, { role: 'owner' });
    console.log(`   ✅ Auth custom claims → { role: 'owner' }`);

    // 3. Verify
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
