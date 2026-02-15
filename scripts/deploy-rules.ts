
import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import * as fs from 'fs';

// Load service account
const serviceAccountPath = './service-account.json';
const rulesPath = './firestore.rules';

async function main() {
    console.log('--- Deploying Security Rules ---');

    try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        const rulesContent = fs.readFileSync(rulesPath, 'utf8');

        initializeApp({
            credential: cert(serviceAccount)
        });

        console.log('Read rules file. Deploying...');

        const ruleset = await getSecurityRules().createRuleset({
            source: {
                files: [{
                    name: 'firestore.rules',
                    content: rulesContent
                }]
            }
        });

        const rulesetName = ruleset.name;
        console.log(`Created ruleset: ${rulesetName}`);

        await getSecurityRules().releaseFirestoreRuleset(rulesetName);
        console.log('✅ Successfully released new ruleset!');

    } catch (error: any) {
        console.error('💥 FATAL ERROR:', error);
    }
}

main();
