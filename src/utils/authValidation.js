/**
 * @fileoverview Email/password validation for the /join inline auth form.
 * Pure — no Firebase imports.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/** @returns {string} trimmed, lowercased email, ready to submit to Firebase */
export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

/** @returns {string|null} error message, or null if valid */
export function validateEmail(email) {
  const trimmed = (email || '').trim();
  if (!EMAIL_RE.test(trimmed)) return "That doesn't look like an email address.";
  return null;
}

/** @returns {string|null} error message, or null if valid */
export function validatePassword(password) {
  if ((password || '').length < MIN_PASSWORD_LENGTH) {
    return `Password needs at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/** @returns {string|null} error message, or null if the two match */
export function validatePasswordConfirm(password, confirmPassword) {
  if (password !== confirmPassword) return "Passwords don't match.";
  return null;
}
