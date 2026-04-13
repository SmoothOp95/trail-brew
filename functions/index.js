/**
 * Trail Brew — Firebase Cloud Functions
 *
 * extractRideFromScreenshot: receives a base64-encoded GPS activity screenshot,
 * calls the Claude vision API to extract ride data, and returns the parsed JSON.
 * The frontend handles all Firestore writes after the user confirms.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');

admin.initializeApp();

const EXTRACTION_PROMPT = `You are extracting mountain bike activity data from a screenshot of a GPS tracking app (such as Strava, Garmin Connect, Wahoo, Komoot, or similar).

Extract the following fields from the screenshot. Return ONLY a valid JSON object with no preamble, no markdown, no explanation.

{
  "activityName": string or null,
  "date": "YYYY-MM-DD" or null,
  "distanceKm": number or null,
  "durationMinutes": number or null,
  "elevationM": number or null,
  "sourceApp": string or null,
  "confidence": {
    "date": "high" | "medium" | "low",
    "distanceKm": "high" | "medium" | "low",
    "durationMinutes": "high" | "medium" | "low",
    "elevationM": "high" | "medium" | "low"
  },
  "notes": string or null
}

Rules:
- distanceKm must be a decimal number (e.g. 28.4), not a string
- durationMinutes must be a total integer (e.g. 112 for 1h52m)
- elevationM is elevation gain in metres — ignore total elevation or max elevation if shown separately
- date must be in YYYY-MM-DD format
- sourceApp should be the name of the app if identifiable from the UI (e.g. "Strava", "Garmin Connect"), otherwise null
- confidence reflects how clearly each value was visible in the screenshot — use "low" if the field was partially obscured, small, or ambiguous
- If a field is not visible or not present in the screenshot, return null for that field
- notes is for anything unusual about the screenshot (e.g. "distance shown in miles, converted to km", "partial activity visible")`;

/**
 * Callable function: extractRideFromScreenshot
 *
 * Request data:
 *   imageBase64 {string}  — base64-encoded image (no data URL prefix)
 *   mediaType   {string}  — MIME type, e.g. "image/jpeg" (default: "image/jpeg")
 *
 * Returns:
 *   { extraction: { activityName, date, distanceKm, durationMinutes, elevationM,
 *                   sourceApp, confidence, notes } }
 *
 * Throws HttpsError on auth failure, missing data, or Claude API errors.
 */
exports.extractRideFromScreenshot = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // 1. Verify the caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be signed in to use this feature.'
      );
    }

    // 2. Validate input
    const { imageBase64, mediaType } = data;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'imageBase64 is required and must be a string.'
      );
    }

    const resolvedMediaType = mediaType || 'image/jpeg';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(resolvedMediaType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Unsupported image type: ${resolvedMediaType}`
      );
    }

    // 3. Read Anthropic API key from Functions config
    const apiKey = functions.config().anthropic && functions.config().anthropic.key;
    if (!apiKey) {
      functions.logger.error('Anthropic API key not configured. Run: firebase functions:config:set anthropic.key="YOUR_KEY"');
      throw new functions.https.HttpsError(
        'internal',
        'Service not configured. Contact support.'
      );
    }

    // 4. Call Claude vision API
    const client = new Anthropic({ apiKey });

    let rawText;
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: resolvedMediaType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      rawText = message.content[0]?.text?.trim() ?? '';
    } catch (err) {
      functions.logger.error('Claude API call failed', err);
      throw new functions.https.HttpsError('internal', 'extraction_failed');
    }

    // 5. Parse JSON — strip markdown fences if Claude wraps the output
    let extraction;
    try {
      const cleaned = rawText
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      extraction = JSON.parse(cleaned);
    } catch (err) {
      functions.logger.error('Failed to parse Claude response as JSON', { rawText });
      throw new functions.https.HttpsError('internal', 'extraction_failed');
    }

    // 6. Return to frontend — the frontend decides whether to proceed
    return { extraction };
  });
