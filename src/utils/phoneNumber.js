/**
 * @fileoverview South African phone number validation and normalization.
 * Accepts local (0821234567) or international (+27821234567) input and
 * normalizes to E.164 (+27821234567). Pure — no Firebase, no React.
 */

// SA subscriber numbers are 9 digits after the trunk prefix (0) or the
// country code (+27), and start with a non-zero digit.
const SA_LOCAL_RE = /^0([1-9]\d{8})$/;
const SA_E164_DIGITS_RE = /^27([1-9]\d{8})$/;

/**
 * @param {string} input - Raw user input, any common formatting.
 * @returns {string|null} E.164 number (e.g. "+27821234567"), or null if
 *   the input isn't a valid SA number.
 */
export function normalizeSAPhoneNumber(input) {
  if (typeof input !== 'string') return null;

  // Strip everything but digits and a leading '+'.
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (hasPlus) {
    const match = digits.match(SA_E164_DIGITS_RE);
    return match ? `+27${match[1]}` : null;
  }

  const localMatch = digits.match(SA_LOCAL_RE);
  if (localMatch) return `+27${localMatch[1]}`;

  // Tolerate country code typed without a leading '+' (e.g. "27821234567").
  const bareMatch = digits.match(SA_E164_DIGITS_RE);
  return bareMatch ? `+27${bareMatch[1]}` : null;
}

/**
 * @param {string} input
 * @returns {boolean}
 */
export function isValidSAPhoneNumber(input) {
  return normalizeSAPhoneNumber(input) !== null;
}
