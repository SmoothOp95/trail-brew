/**
 * @fileoverview Maps Firebase Auth error codes to human, on-brand messages.
 * Pure — takes a code string, returns a string. Never surfaces raw Firebase
 * errors to a rider.
 *
 * `auth/invalid-credential` / `auth/wrong-password` / `auth/user-not-found`
 * intentionally share one message — revealing which of the three occurred
 * would let an attacker enumerate registered emails.
 */

const MESSAGES = {
  'auth/email-already-in-use':
    "There's already an account with this email. Try signing in instead.",
  'auth/invalid-credential':
    "Email or password doesn't match. Try again, or use Forgot password.",
  'auth/wrong-password':
    "Email or password doesn't match. Try again, or use Forgot password.",
  'auth/user-not-found':
    "Email or password doesn't match. Try again, or use Forgot password.",
  'auth/too-many-requests':
    'Too many attempts — take a breather and try again in a few minutes.',
  'auth/network-request-failed':
    'Network wobble. Check your connection and try again.',
  'auth/account-exists-with-different-credential':
    'This email is linked to Google sign-in. Use the Google button above.',
};

const DEFAULT_MESSAGE =
  'Something went sideways. Try again — if it keeps happening, shout in the WhatsApp group or mail us.';

/**
 * @param {string} code - Firebase Auth error code, e.g. err.code
 * @returns {string} user-facing message
 */
export function getAuthErrorMessage(code) {
  return MESSAGES[code] || DEFAULT_MESSAGE;
}
