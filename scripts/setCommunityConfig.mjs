// Writes/updates the config/community Firestore document — currently just
// the WhatsApp general invite link. Kept as a script (not a value in the
// codebase) so admins can rotate the link without a redeploy — just re-run
// this any time the link changes.
//
// Usage (no key file needed — recommended, e.g. in Google Cloud Shell):
//   gcloud auth application-default login
//   gcloud config set project trail-brew-33084
//   node scripts/setCommunityConfig.mjs --whatsapp-url="https://chat.whatsapp.com/..."
//
// Or with a downloaded service account key: drop serviceAccountKey.json in
// the project root and run the same command. See scripts/credentials.mjs.

import { getDb } from './credentials.mjs';

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

const db = await getDb();

db.collection('config').doc('community')
  .set({ whatsappGeneralInviteUrl }, { merge: true })
  .then(() => console.log('config/community updated with whatsappGeneralInviteUrl.'))
  .catch((err) => {
    console.error('Failed to update config/community:', err);
    process.exit(1);
  });
