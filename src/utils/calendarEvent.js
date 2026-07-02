// Build a downloadable .ics calendar invite for a scheduled ride.
// .ics is the universal format — Apple Calendar, Google Calendar and Outlook
// all import it, so a single "Add to calendar" button covers every rider.

const RIDE_DURATION_HOURS = 3;
// South Africa is UTC+2 year-round (no daylight saving), so we can convert a
// local ride time to UTC with a fixed offset and emit unambiguous UTC stamps.
const SAST_OFFSET_HOURS = 2;

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Format a Date as an iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ */
function toICSStampUTC(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Turn a ride's local date + time into a UTC Date, optionally offset by hours. */
function rideDateToUTC(dateISO, timeHHMM, addHours = 0) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [hh, mm] = timeHHMM.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - SAST_OFFSET_HOURS + addHours, mm, 0));
}

/** Escape text for an iCalendar field (RFC 5545). */
function escapeICS(text = '') {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Build the raw .ics string for a resolved ride object. */
export function buildRideICS(ride) {
  const { trail } = ride;
  const start = rideDateToUTC(ride.date, ride.startTime);
  const end = rideDateToUTC(ride.date, ride.startTime, RIDE_DURATION_HOURS);
  const difficulty = trail.difficultyLevels?.join(', ') || '';

  const description = [
    ride.tagline,
    '',
    difficulty && `Difficulty: ${difficulty}`,
    `Ride ${ride.position} of ${ride.total} in the Trail Brew 2026 series.`,
    trail.mapUrl && `Directions: ${trail.mapUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trail Brew//Ride Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:trailblu-${ride.trailId}-${ride.date}@trailbrew`,
    `DTSTAMP:${toICSStampUTC(new Date())}`,
    `DTSTART:${toICSStampUTC(start)}`,
    `DTEND:${toICSStampUTC(end)}`,
    `SUMMARY:${escapeICS(`Trail Brew Ride: ${trail.name}`)}`,
    `LOCATION:${escapeICS(trail.location)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    trail.mapUrl ? `URL:${escapeICS(trail.mapUrl)}` : null,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(`Trail Brew ride tomorrow: ${trail.name}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  // iCalendar requires CRLF line endings.
  return lines.join('\r\n');
}

/** Generate and download the .ics file for a ride. */
export function downloadRideICS(ride) {
  const ics = buildRideICS(ride);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trailblu-${ride.trailId}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
