/**
 * @fileoverview ocrExtract — client-side OCR extraction for GPS activity screenshots.
 *
 * Uses Tesseract.js (lazy-loaded) to extract text from an image file, then
 * runs a set of heuristic regex patterns over the result to pull out:
 *   - distanceKm   (number | null)
 *   - durationMinutes (number | null)
 *   - elevationM   (number | null)
 *   - date         (YYYY-MM-DD string | null)
 *   - sourceApp    (string | null)
 *
 * Confidence is reported as "high" / "medium" / "low" based on how
 * unambiguously each value was found.
 *
 * No server, no API key, no cost — runs entirely in the browser.
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse a float safely, returning null for NaN / zero */
function safeFloat(str) {
  const n = parseFloat(str.replace(/,/g, '.'));
  return isNaN(n) || n === 0 ? null : n;
}

/** Convert "h:mm:ss" or "h:mm" or "mm:ss" strings to total minutes */
function parseColonTime(str) {
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) {
    // h:mm:ss
    return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
  }
  if (parts.length === 2) {
    // Could be h:mm (if hours part > 0) or mm:ss
    // Heuristic: if first part < 10 and second < 60, treat as h:mm
    if (parts[0] < 10 && parts[1] < 60) {
      return parts[0] * 60 + parts[1];
    }
    // Otherwise mm:ss
    return parts[0] + Math.round(parts[1] / 60);
  }
  return null;
}

// ── Source app detection ───────────────────────────────────────────────────

const APP_SIGNATURES = [
  { pattern: /strava/i,          name: 'Strava' },
  { pattern: /garmin/i,          name: 'Garmin Connect' },
  { pattern: /wahoo/i,           name: 'Wahoo' },
  { pattern: /komoot/i,          name: 'Komoot' },
  { pattern: /suunto/i,          name: 'Suunto' },
  { pattern: /coros/i,           name: 'COROS' },
  { pattern: /mapmyride/i,       name: 'MapMyRide' },
  { pattern: /ridewithgps/i,     name: 'RideWithGPS' },
  { pattern: /polar\s+flow/i,    name: 'Polar Flow' },
];

function detectSourceApp(text) {
  for (const { pattern, name } of APP_SIGNATURES) {
    if (pattern.test(text)) return name;
  }
  return null;
}

// ── Distance extraction ────────────────────────────────────────────────────

const DISTANCE_PATTERNS = [
  // "20.80 km" / "20,80 km" / "20.8km"
  /(\d{1,3}[.,]\d{1,2})\s*km\b/i,
  // "20 km" (whole number)
  /\b(\d{1,3})\s*km\b/i,
  // Miles — convert to km
  /(\d{1,3}[.,]\d{1,2})\s*mi(?:les?)?\b/i,
  /\b(\d{1,3})\s*mi(?:les?)?\b/i,
];

function extractDistance(text) {
  // Try km patterns first
  for (let i = 0; i < 2; i++) {
    const m = text.match(DISTANCE_PATTERNS[i]);
    if (m) {
      const val = safeFloat(m[1]);
      if (val && val > 0.5 && val < 500) {
        return { distanceKm: Math.round(val * 10) / 10, confidence: i === 0 ? 'high' : 'medium' };
      }
    }
  }
  // Try miles
  for (let i = 2; i < 4; i++) {
    const m = text.match(DISTANCE_PATTERNS[i]);
    if (m) {
      const miles = safeFloat(m[1]);
      if (miles && miles > 0.3 && miles < 300) {
        return {
          distanceKm: Math.round(miles * 1.60934 * 10) / 10,
          confidence: 'medium',
          notes: 'Distance shown in miles, converted to km',
        };
      }
    }
  }
  return { distanceKm: null, confidence: 'low' };
}

// ── Duration extraction ────────────────────────────────────────────────────

const DURATION_PATTERNS = [
  // "1:52:30" or "1:52"
  /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/,
  // "1h 52m" / "1h52m" / "1 h 52 min"
  /\b(\d{1,2})\s*h(?:r|ours?)?\s*(\d{1,2})\s*m(?:in(?:utes?)?)?\b/i,
  // "52m" / "52 min" (no hours)
  /\b(\d{2,3})\s*m(?:in(?:utes?)?)?\b/i,
];

function extractDuration(text) {
  // Colon format — most common in GPS apps
  const m1 = text.match(DURATION_PATTERNS[0]);
  if (m1) {
    const mins = parseColonTime(m1[1]);
    if (mins && mins > 2 && mins < 1440) {
      return { durationMinutes: mins, confidence: 'high' };
    }
  }

  // "Xh Ym" format
  const m2 = text.match(DURATION_PATTERNS[1]);
  if (m2) {
    const mins = parseInt(m2[1]) * 60 + parseInt(m2[2]);
    if (mins > 2 && mins < 1440) {
      return { durationMinutes: mins, confidence: 'high' };
    }
  }

  // Minutes only
  const m3 = text.match(DURATION_PATTERNS[2]);
  if (m3) {
    const mins = parseInt(m3[1]);
    if (mins > 2 && mins < 1440) {
      return { durationMinutes: mins, confidence: 'medium' };
    }
  }

  return { durationMinutes: null, confidence: 'low' };
}

// ── Elevation extraction ───────────────────────────────────────────────────

const ELEVATION_PATTERNS = [
  // Context words followed by number + m/ft
  /(?:gain|ascent|elev(?:ation)?|vert(?:ical)?|↑|climb)\D{0,10}(\d{1,4})\s*m\b/i,
  /(?:gain|ascent|elev(?:ation)?|vert(?:ical)?|↑|climb)\D{0,10}(\d{1,4})\s*ft\b/i,
  // Number followed by "m gain" etc.
  /(\d{1,4})\s*m\s*(?:gain|ascent|elev(?:ation)?|climb)/i,
  /(\d{1,4})\s*ft\s*(?:gain|ascent|elev(?:ation)?|climb)/i,
  // Standalone "525 m" — lower confidence (could be distance in trail context)
  /\b(\d{3,4})\s*m\b/,
];

function extractElevation(text) {
  // High-confidence: has context keyword
  for (let i = 0; i < 4; i++) {
    const m = text.match(ELEVATION_PATTERNS[i]);
    if (m) {
      let val = parseInt(m[1]);
      if (i === 1 || i === 3) val = Math.round(val * 0.3048); // ft → m
      if (val > 0 && val < 8000) {
        return { elevationM: val, confidence: 'high' };
      }
    }
  }
  // Low-confidence: bare number + "m"
  const m5 = text.match(ELEVATION_PATTERNS[4]);
  if (m5) {
    const val = parseInt(m5[1]);
    if (val > 50 && val < 8000) {
      return { elevationM: val, confidence: 'low' };
    }
  }
  return { elevationM: null, confidence: 'low' };
}

// ── Date extraction ────────────────────────────────────────────────────────

const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function extractDate(text) {
  // "13 Apr 2025" / "April 13, 2025" / "13 April 2025"
  const longDate = text.match(
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})\b/i
  );
  if (longDate) {
    const [, d, mon, y] = longDate;
    return {
      date: `${y}-${MONTHS[mon.toLowerCase().slice(0, 3)]}-${d.padStart(2, '0')}`,
      confidence: 'high',
    };
  }

  const longDate2 = text.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i
  );
  if (longDate2) {
    const [, mon, d, y] = longDate2;
    return {
      date: `${y}-${MONTHS[mon.toLowerCase().slice(0, 3)]}-${d.padStart(2, '0')}`,
      confidence: 'high',
    };
  }

  // "2025-04-13" / "2025/04/13"
  const iso = text.match(/\b(20\d{2})[-/](\d{2})[-/](\d{2})\b/);
  if (iso) {
    return { date: `${iso[1]}-${iso[2]}-${iso[3]}`, confidence: 'high' };
  }

  // "13/04/2025" or "04/13/2025" — ambiguous, mark medium
  const dmy = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/);
  if (dmy) {
    // South African locale: DD/MM/YYYY
    const [, d, m, y] = dmy;
    return {
      date: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
      confidence: 'medium',
    };
  }

  return { date: null, confidence: 'low' };
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Run Tesseract OCR on the given File, then extract ride data from the text.
 *
 * Tesseract.js is imported dynamically so it's only bundled/downloaded when
 * this function is first called — it won't bloat initial page load.
 *
 * @param {File} file
 * @param {(progress: number) => void} [onProgress]  0–100
 * @returns {Promise<{
 *   distanceKm: number|null,
 *   durationMinutes: number|null,
 *   elevationM: number|null,
 *   date: string|null,
 *   sourceApp: string|null,
 *   confidence: { distanceKm: string, durationMinutes: string, elevationM: string, date: string },
 *   notes: string|null,
 * }>}
 */
export async function extractRideFromImage(file, onProgress) {
  // Dynamic import — Tesseract only loads when this function runs
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker('eng', 1, {
    logger: onProgress
      ? (m) => {
          if (m.status === 'recognizing text') {
            onProgress(Math.round(m.progress * 100));
          }
        }
      : undefined,
  });

  let rawText = '';
  try {
    const { data } = await worker.recognize(file);
    rawText = data.text;
  } finally {
    await worker.terminate();
  }

  // Normalize whitespace for easier matching
  const text = rawText.replace(/\s+/g, ' ').trim();

  const { distanceKm, confidence: dConf, notes: dNotes } = extractDistance(text);
  const { durationMinutes, confidence: tConf } = extractDuration(text);
  const { elevationM, confidence: eConf } = extractElevation(text);
  const { date, confidence: dateConf } = extractDate(text);
  const sourceApp = detectSourceApp(text);

  return {
    distanceKm,
    durationMinutes,
    elevationM,
    date,
    sourceApp,
    confidence: {
      distanceKm: dConf,
      durationMinutes: tConf,
      elevationM: eConf,
      date: dateConf,
    },
    notes: dNotes ?? null,
  };
}
