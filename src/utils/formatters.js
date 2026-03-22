/**
 * @fileoverview Formatting utilities for display values.
 * Pure functions — no React, no Firebase.
 */

/**
 * Converts metres to kilometres, rounded to one decimal place.
 * Used when processing raw Strava activity distances.
 *
 * @param {number} metres
 * @returns {number}
 */
export function metersToKm(metres) {
  return Math.round((metres / 1000) * 10) / 10;
}

/**
 * Converts seconds to a "Xh Ym" string.
 * Used when processing raw Strava moving_time values.
 *
 * @param {number} seconds
 * @returns {string} e.g. "1h 23m" or "45m"
 */
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Converts seconds to decimal hours, rounded to one decimal place.
 * Used when adding Strava moving_time to bike totalHours.
 *
 * @param {number} seconds
 * @returns {number}
 */
export function secondsToHours(seconds) {
  return Math.round((seconds / 3600) * 10) / 10;
}

/**
 * Returns a human-readable relative time string from an ISO 8601 date string.
 *
 * @param {string} isoString - ISO 8601 date or datetime string
 * @returns {string} e.g. "just now", "3 minutes ago", "2 days ago", "14 Mar 2025"
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return 'Never';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  // Older than a week — show a readable date
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a ZAR amount from cents to a display string.
 *
 * @param {number} cents
 * @returns {string} e.g. "R499", "R1 200"
 */
export function formatZAR(cents) {
  const rands = cents / 100;
  return `R${rands.toLocaleString('en-ZA')}`;
}

/**
 * Returns today's date as an ISO 8601 date string (YYYY-MM-DD).
 * Convenient default for date inputs.
 *
 * @returns {string}
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}
