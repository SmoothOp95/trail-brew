/**
 * @fileoverview useRideLog — ride logging hook for Trail Brew.
 *
 * Responsibilities:
 *   - Call the `extractRideFromScreenshot` Cloud Function with a base64 image
 *   - Write a ride document to users/{uid}/rides/{rideId} via a batched Firestore write
 *   - Atomically update the user document (riddenTrails array + bikeData totals) in
 *     the same batch so ride doc and counters are always consistent
 *   - Fetch past rides for a given trail (lazy — called when the history view opens)
 *   NOTE: Screenshot upload to Firebase Storage is disabled (bucket not provisioned).
 */

import { useState } from 'react';
import {
  doc,
  collection,
  writeBatch,
  increment,
  arrayUnion,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
// import { ref, uploadBytes } from 'firebase/storage'; // Storage disabled
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { extractRideFromImage } from '../lib/ocrExtract';

export function useRideLog() {
  const { user } = useAuth();
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  /**
   * Run client-side OCR on the selected image and return the extraction result.
   * Uses Tesseract.js — no server, no API key, no cost.
   *
   * @param {File} file
   * @param {(progress: number) => void} [onProgress]  0–100
   * @returns {Promise<object>} extraction result
   */
  const extractFromScreenshot = async (file, onProgress) => {
    setExtracting(true);
    setExtractError(null);

    try {
      const result = await extractRideFromImage(file, onProgress);
      return result;
    } catch (err) {
      const msg = err?.message || 'Failed to read screenshot';
      setExtractError(msg);
      throw err;
    } finally {
      setExtracting(false);
    }
  };

  /**
   * Write the confirmed ride to Firestore in a single batched operation:
   *   1. Set the ride document under users/{uid}/rides/{rideId}
   *   2. Update the user document:
   *      - arrayUnion trailId into riddenTrails
   *      - increment bikeData.totalDistance if distanceKm is provided
   *      - increment bikeData.totalHours if durationMinutes is provided
   *
   * After the batch commits, upload the screenshot file to Storage if supplied.
   *
   * @param {object} params
   * @param {string}      params.trailId
   * @param {string}      params.trailName
   * @param {string}      params.date              ISO date string (YYYY-MM-DD)
   * @param {number|null} params.distanceKm
   * @param {number|null} params.durationMinutes   total minutes (integer)
   * @param {number|null} params.elevationM        elevation gain in metres
   * @param {string}      params.note              may be empty string
   * @param {'screenshot_ai'|'self_report'} params.verificationMethod
   * @param {File|null}   params.screenshotFile    uploaded after confirmation
   * @param {object|null} params.aiRawExtraction   raw JSON from Claude (audit log)
   * @param {object|null} params.aiConfidence      per-field confidence scores
   * @returns {Promise<string>} Firestore ride document ID
   */
  const logRide = async ({
    trailId,
    trailName,
    date,
    distanceKm,
    durationMinutes,
    elevationM,
    note,
    verificationMethod,
    screenshotFile,
    aiRawExtraction,
    aiConfidence,
  }) => {
    if (!user) throw new Error('Must be signed in to log a ride.');

    setSubmitting(true);
    setSubmitError(null);

    try {
      // --- Batched Firestore write ---
      const batch = writeBatch(db);

      // Ride document reference (auto-ID)
      const rideRef = doc(collection(db, 'users', user.uid, 'rides'));

      const rideData = {
        trailId,
        trailName,
        date,
        distanceKm: distanceKm ?? null,
        durationMinutes: durationMinutes ?? null,
        elevationM: elevationM ?? null,
        note: note ?? '',
        verificationMethod,
        // screenshotStoragePath: null, // Storage disabled — omitted until bucket is provisioned
        aiRawExtraction: aiRawExtraction ?? null,
        aiConfidence: aiConfidence ?? null,
        loggedAt: serverTimestamp(),
      };

      batch.set(rideRef, rideData);

      // User document updates — always add trailId to riddenTrails
      const userRef = doc(db, 'users', user.uid);
      const userUpdates = {
        riddenTrails: arrayUnion(trailId),
      };

      // Only increment service dashboard counters if the user provided values.
      // bikeData.totalDistance stores cumulative km; bikeData.totalHours stores
      // cumulative hours — so convert durationMinutes → hours before incrementing.
      if (distanceKm != null) {
        userUpdates['bikeData.totalDistance'] = increment(distanceKm);
      }
      if (durationMinutes != null) {
        userUpdates['bikeData.totalHours'] = increment(durationMinutes / 60);
      }

      batch.update(userRef, userUpdates);

      // Commit ride doc + user doc update atomically
      await batch.commit();

      // --- Screenshot upload disabled (Storage bucket not provisioned) ---
      // Re-enable this block once Firebase Storage is set up:
      //
      // if (screenshotFile) {
      //   try {
      //     const { ref, uploadBytes } = await import('firebase/storage');
      //     const { storage } = await import('../lib/firebase');
      //     const timestamp = Date.now();
      //     const ext = screenshotFile.type === 'image/png' ? 'png'
      //       : screenshotFile.type === 'image/webp' ? 'webp'
      //       : 'jpg';
      //     const storagePath = `ride-screenshots/${user.uid}/${timestamp}_${trailId}.${ext}`;
      //     const storageRef = ref(storage, storagePath);
      //     await uploadBytes(storageRef, screenshotFile, { contentType: screenshotFile.type });
      //     const { updateDoc } = await import('firebase/firestore');
      //     await updateDoc(rideRef, { screenshotStoragePath: storagePath });
      //   } catch {
      //     // Non-fatal — ride is already saved.
      //   }
      // }

      return rideRef.id;
    } catch (err) {
      const msg = err?.message || 'Failed to save ride';
      setSubmitError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Fetch all past rides for a specific trail, ordered newest first.
   * This is called lazily when the user opens the history view.
   *
   * @param {string} trailId
   * @returns {Promise<Array>}
   */
  const getTrailRides = async (trailId) => {
    if (!user) return [];

    const snap = await getDocs(
      query(
        collection(db, 'users', user.uid, 'rides'),
        where('trailId', '==', trailId),
        orderBy('loggedAt', 'desc')
      )
    );

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  return {
    extractFromScreenshot,
    logRide,
    getTrailRides,
    extracting,
    submitting,
    extractError,
    submitError,
  };
}
