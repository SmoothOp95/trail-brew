/**
 * @fileoverview Firestore access for the onboarding survey (/join).
 * All writes live here, separate from OnboardingSurvey's UI state and from
 * the (future) pure level-scoring function — this module only ever
 * persists the raw answers a rider gave.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizeSAPhoneNumber } from '../utils/phoneNumber';

// Drops keys whose value is undefined, null, or an empty string, so
// skipped optional fields (e.g. referralMemberName when not applicable)
// never get written at all rather than as "".
function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * Fetches a user's profile document, or null if they don't have one yet.
 * @param {string} uid
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * @param {object|null} profile - Result of getUserProfile.
 * @returns {boolean} Whether this rider has already completed the survey —
 *   the re-entry check for /join. Every signed-in user gets a users/{uid}
 *   doc on sign-in (see useAuth), so profile existence alone isn't enough;
 *   surveyCompletedAt is only ever set on submission.
 */
export function hasCompletedSurvey(profile) {
  return Boolean(profile?.surveyCompletedAt);
}

/**
 * Normalizes and persists a completed onboarding survey to users/{uid}.
 * Merges so it never clobbers fields written elsewhere (riddenTrails,
 * bikeData, etc).
 *
 * @param {string} uid
 * @param {object} answers - Raw answers from OnboardingSurvey.
 */
export async function submitOnboardingSurvey(uid, answers) {
  const whatsappNumber = normalizeSAPhoneNumber(answers.whatsappNumber);
  const emergencyContactNumber = normalizeSAPhoneNumber(answers.emergencyContactNumber);

  if (!whatsappNumber) throw new Error('WhatsApp number is missing or invalid.');
  if (!emergencyContactNumber) throw new Error('Emergency contact number is missing or invalid.');

  const payload = compact({
    displayName: (answers.displayName || '').trim(),
    whatsappNumber,
    referralSource: answers.referralSource,
    referralMemberName: (answers.referralMemberName || '').trim(),
    referralOther: (answers.referralOther || '').trim(),
    ridingTenure: answers.ridingTenure,
    ridingFrequency: answers.ridingFrequency,
    bike: (answers.bike || '').trim(),
    trailsRiddenIds: answers.trailsRiddenIds || [],
    scenarioDescent: answers.scenarioDescent,
    scenarioEndurance: answers.scenarioEndurance,
    scenarioAir: answers.scenarioAir,
    disciplineLeaning: answers.disciplineLeaning,
    goals: (answers.goals || '').trim(),
    emergencyContactName: (answers.emergencyContactName || '').trim(),
    emergencyContactNumber,
    notes: (answers.notes || '').trim(),
  });
  payload.surveyCompletedAt = serverTimestamp();

  await setDoc(doc(db, 'users', uid), payload, { merge: true });
}

/**
 * Reads the community config doc (WhatsApp invite link, etc). By design
 * this is only ever called after a completed survey submission — see
 * SuccessScreen.
 * @returns {Promise<{ whatsappGeneralInviteUrl?: string }>}
 */
export async function fetchCommunityConfig() {
  const snap = await getDoc(doc(db, 'config', 'community'));
  return snap.exists() ? snap.data() : {};
}
