// One-time (idempotent) script to copy the 19 Gauteng trails from
// src/data/trails.js into the Firestore `trails` collection, so the
// onboarding survey (Q7) and any other future callers can read trail data
// live instead of it being duplicated into components.
//
// This is a trusted server-side write using firebase-admin, which bypasses
// firestore.rules entirely (rules restrict client writes to /trails/** to
// callers with the `admin` custom claim — this script is the admin path).
//
// Usage (no key file needed — recommended, e.g. in Google Cloud Shell):
//   gcloud auth application-default login
//   gcloud config set project trail-brew-33084
//   node scripts/seedTrails.mjs
//
// Or with a downloaded service account key: drop serviceAccountKey.json in
// the project root and run the same command. See scripts/credentials.mjs.
//
// Safe to re-run: each write is `set({ ...trail }, { merge: true })` keyed
// by the trail's existing `id`, so re-running after editing
// src/data/trails.js just updates the same docs.

import { trails } from '../src/data/trails.js';
import { getDb } from './credentials.mjs';

const db = await getDb();

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
