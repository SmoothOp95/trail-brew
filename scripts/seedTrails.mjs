// One-time (idempotent) script to copy the 19 Gauteng trails from
// src/data/trails.js into the Firestore `trails` collection, so the
// onboarding survey (Q7) and any other future callers can read trail data
// live instead of it being duplicated into components.
//
// This is a trusted server-side write using firebase-admin, which bypasses
// firestore.rules entirely (rules restrict client writes to /trails/** to
// callers with the `admin` custom claim — this script is the admin path).
//
// Usage:
//   1. Firebase Console → Project settings → Service accounts →
//      "Generate new private key". Save the JSON as
//      serviceAccountKey.json in the project root (already gitignored).
//   2. node scripts/seedTrails.mjs
//
// Safe to re-run: each write is `set({ ...trail }, { merge: true })` keyed
// by the trail's existing `id`, so re-running after editing
// src/data/trails.js just updates the same docs.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { trails } from '../src/data/trails.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

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

async function seedTrails() {
  const batch = db.batch();
  for (const trail of trails) {
    const ref = db.collection('trails').doc(trail.id);
    batch.set(ref, trail, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${trails.length} trails into Firestore \`trails\` collection.`);
}

seedTrails().catch((err) => {
  console.error('Failed to seed trails:', err);
  process.exit(1);
});
