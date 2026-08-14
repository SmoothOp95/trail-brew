// Shared credential bootstrap for the one-time admin scripts.
//
// Two supported ways to authenticate, tried in this order:
//
//  1. serviceAccountKey.json in the project root (gitignored).
//     Download from Firebase Console → Project settings → Service accounts →
//     "Generate new private key". Delete it when you're done — it grants full
//     read/write on this project's Firestore.
//
//  2. Application Default Credentials (no key file at all).
//     This is the preferred path. In Google Cloud Shell — or on any machine
//     with the gcloud CLI — run once:
//
//         gcloud auth application-default login
//         gcloud config set project trail-brew-33084
//
//     and the scripts authenticate as *you*, using your own Google account's
//     project permissions. Nothing is downloaded, nothing needs cleaning up,
//     and there is no long-lived key to leak or rotate.
//
// Either way, these are trusted server-side writes via firebase-admin, which
// bypass firestore.rules entirely.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  'trail-brew-33084';

function credentialHelp(err) {
  return (
    'Could not authenticate to Firebase.\n\n' +
    'Pick one of these:\n\n' +
    '  A) Application Default Credentials (recommended — no key file):\n' +
    '       gcloud auth application-default login\n' +
    `       gcloud config set project ${PROJECT_ID}\n\n` +
    '  B) Service account key:\n' +
    '       Firebase Console → Project settings → Service accounts →\n' +
    '       "Generate new private key", save it as serviceAccountKey.json in\n' +
    '       the project root, and delete it once the script has run.\n\n' +
    `Underlying error: ${err.message}`
  );
}

/**
 * Initialise firebase-admin and return a Firestore handle.
 * Exits with a readable message if neither credential source is usable.
 *
 * Async because ADC lookup is lazy in firebase-admin — we force a token
 * fetch up front so a missing/expired login fails here with clear guidance,
 * rather than deep inside a Firestore write.
 */
export async function getDb() {
  if (existsSync(serviceAccountPath)) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    } catch (err) {
      console.error(
        `Found ${serviceAccountPath} but could not parse it as JSON (${err.message}).\n` +
        'Re-download the key, or delete the file to fall back to Application ' +
        'Default Credentials.'
      );
      process.exit(1);
    }
    console.log(
      `Authenticating with serviceAccountKey.json (project ${serviceAccount.project_id}).`
    );
    initializeApp({ credential: cert(serviceAccount) });
    return getFirestore();
  }

  try {
    console.log(
      `No serviceAccountKey.json found — using Application Default Credentials ` +
      `(project ${PROJECT_ID}).`
    );
    const credential = applicationDefault();
    // Force the lazy ADC lookup now, so failures surface here.
    await credential.getAccessToken();
    initializeApp({ credential, projectId: PROJECT_ID });
    return getFirestore();
  } catch (err) {
    console.error(credentialHelp(err));
    process.exit(1);
  }
}
