// Writes/updates the config/community Firestore document — currently just
// the WhatsApp general invite link. Kept as a script (not a value in the
// codebase) so admins can rotate the link without a redeploy: generate a
// service account key once, then re-run this any time the link changes.
//
// Usage:
//   1. Firebase Console → Project settings → Service accounts →
//      "Generate new private key". Save the JSON as
//      serviceAccountKey.json in the project root (already gitignored).
//   2. node scripts/setCommunityConfig.mjs --whatsapp-url="https://chat.whatsapp.com/..."

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

const arg = process.argv.find((a) => a.startsWith('--whatsapp-url='));
const whatsappGeneralInviteUrl = arg?.slice('--whatsapp-url='.length);

if (!whatsappGeneralInviteUrl) {
  console.error(
    'Usage: node scripts/setCommunityConfig.mjs --whatsapp-url="https://chat.whatsapp.com/..."'
  );
  process.exit(1);
}
if (!/^https:\/\/chat\.whatsapp\.com\/.+/.test(whatsappGeneralInviteUrl)) {
  console.error(
    `"${whatsappGeneralInviteUrl}" doesn't look like a WhatsApp invite link ` +
    '(expected https://chat.whatsapp.com/...). Double-check before re-running.'
  );
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch {
  console.error(
    `Could not read ${serviceAccountPath}.\n` +
    'Download a service account key from Firebase Console → Project settings → ' +
    'Service accounts → Generate new private key, and save it as serviceAccountKey.json ' +
    'in the project root before running this script.'
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

db.collection('config').doc('community')
  .set({ whatsappGeneralInviteUrl }, { merge: true })
  .then(() => console.log('config/community updated with whatsappGeneralInviteUrl.'))
  .catch((err) => {
    console.error('Failed to update config/community:', err);
    process.exit(1);
  });
