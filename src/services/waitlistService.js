/**
 * @fileoverview Firestore access for the iOS TestFlight waiting list.
 * TestFlight is invite-only for now (no public link), so app-preview pages
 * collect an email instead of linking straight to a join URL — Tumi
 * batches through testflightWaitlist and invites people manually.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizeEmail } from '../utils/authValidation';

/**
 * @param {{ email: string, uid?: string|null, feature?: string }} params
 *   feature is the preview page slug the signup came from (e.g.
 *   'service-dashboard') — just for prioritizing invites, not required.
 */
export async function joinTestflightWaitlist({ email, uid = null, feature }) {
  const payload = {
    email: normalizeEmail(email),
    createdAt: serverTimestamp(),
  };
  if (uid) payload.uid = uid;
  if (feature) payload.feature = feature;

  await addDoc(collection(db, 'testflightWaitlist'), payload);
}
