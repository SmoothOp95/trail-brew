// Writes/updates the config/community Firestore document — the WhatsApp
// general invite link and the iOS TestFlight link. Kept as a script (not a
// value in the codebase) so admins can rotate either link without a
// redeploy — just re-run this any time a link changes.
//
// Usage (no key file needed — recommended, e.g. in Google Cloud Shell):
//   gcloud auth application-default login
//   gcloud config set project trail-brew-33084
//   node scripts/setCommunityConfig.mjs --whatsapp-url="https://chat.whatsapp.com/..."
//   node scripts/setCommunityConfig.mjs --ios-testflight-url="https://testflight.apple.com/join/..."
//   # or both in one go:
//   node scripts/setCommunityConfig.mjs --whatsapp-url="..." --ios-testflight-url="..."
//
// Or with a downloaded service account key: drop serviceAccountKey.json in
// the project root and run the same command. See scripts/credentials.mjs.

import { getDb } from './credentials.mjs';

function getArg(flag) {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  return arg?.slice(flag.length + 3);
}

const whatsappUrl = getArg('whatsapp-url');
const iosTestflightUrl = getArg('ios-testflight-url');

if (!whatsappUrl && !iosTestflightUrl) {
  console.error(
    'Usage: node scripts/setCommunityConfig.mjs --whatsapp-url="https://chat.whatsapp.com/..." ' +
    'and/or --ios-testflight-url="https://testflight.apple.com/join/..."'
  );
  process.exit(1);
}

const payload = {};

if (whatsappUrl) {
  if (!/^https:\/\/chat\.whatsapp\.com\/.+/.test(whatsappUrl)) {
    console.error(
      `"${whatsappUrl}" doesn't look like a WhatsApp invite link ` +
      '(expected https://chat.whatsapp.com/...). Double-check before re-running.'
    );
    process.exit(1);
  }
  payload.whatsappGeneralInviteUrl = whatsappUrl;
}

if (iosTestflightUrl) {
  if (!/^https:\/\/testflight\.apple\.com\/join\/.+/.test(iosTestflightUrl)) {
    console.error(
      `"${iosTestflightUrl}" doesn't look like a TestFlight link ` +
      '(expected https://testflight.apple.com/join/...). Double-check before re-running.'
    );
    process.exit(1);
  }
  payload.iosTestflightUrl = iosTestflightUrl;
}

const db = await getDb();

db.collection('config').doc('community')
  .set(payload, { merge: true })
  .then(() => console.log(`config/community updated with ${Object.keys(payload).join(', ')}.`))
  .catch((err) => {
    console.error('Failed to update config/community:', err);
    process.exit(1);
  });
