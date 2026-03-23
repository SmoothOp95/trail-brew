/**
 * @fileoverview One-time migration from MTB dashboard localStorage keys to Firestore.
 *
 * The Mountain-bike-dashboard stored data under these localStorage keys:
 *   - "bikeTrackerData"     → BikeData object
 *   - "bikeServiceHistory"  → ServiceRecord[]
 *   - "bikeRepairHistory"   → RepairRecord[]
 *
 * On first load after sign-in, this function checks for those keys,
 * writes the data to Firestore, then removes the keys so migration
 * never runs again.
 *
 * Migration is gated by: localStorage.getItem('trailBrewMigrated') !== 'true'
 * so it only ever runs once per browser.
 */

import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_BIKE_DATA } from '../types/index';

const MIGRATION_FLAG = 'trailBrewMigrated';

// Keys used by the original MTB dashboard
const LS_BIKE_DATA = 'bikeTrackerData';
const LS_SERVICE_HISTORY = 'bikeServiceHistory';
const LS_REPAIR_HISTORY = 'bikeRepairHistory';

/**
 * Safely parse a localStorage value as JSON.
 * Returns null if the key is absent or the value is malformed.
 *
 * @param {string} key
 * @returns {any|null}
 */
function safeParse(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Run the one-time localStorage → Firestore migration for a signed-in user.
 * Safe to call on every app load — exits immediately if already migrated
 * or if no legacy data exists.
 *
 * @param {import('firebase/auth').User} user - The currently signed-in Firebase user
 * @returns {Promise<void>}
 */
export async function migrateLocalStorageToFirestore(user) {
  if (!user) return;
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') return;

  const legacyBikeData = safeParse(LS_BIKE_DATA);
  const legacyServiceHistory = safeParse(LS_SERVICE_HISTORY);
  const legacyRepairHistory = safeParse(LS_REPAIR_HISTORY);

  // Nothing to migrate
  if (!legacyBikeData && !legacyServiceHistory && !legacyRepairHistory) {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return;
  }

  const userRef = doc(db, 'users', user.uid);

  try {
    // Migrate BikeData — merge into the user document
    if (legacyBikeData) {
      const bikeData = {
        ...DEFAULT_BIKE_DATA,
        nickname: legacyBikeData.nickname ?? DEFAULT_BIKE_DATA.nickname,
        lastServiceDate: legacyBikeData.lastServiceDate ?? '',
        totalDistance: Number(legacyBikeData.totalDistance) || 0,
        totalHours: Number(legacyBikeData.totalHours) || 0,
        serviceIntervalDistance:
          Number(legacyBikeData.serviceIntervalDistance) ||
          DEFAULT_BIKE_DATA.serviceIntervalDistance,
        serviceIntervalHours:
          Number(legacyBikeData.serviceIntervalHours) ||
          DEFAULT_BIKE_DATA.serviceIntervalHours,
      };
      await updateDoc(userRef, { bikeData });
    }

    // Migrate ServiceHistory — each record becomes a subcollection document
    if (Array.isArray(legacyServiceHistory) && legacyServiceHistory.length > 0) {
      const serviceCol = collection(db, 'users', user.uid, 'serviceHistory');
      await Promise.all(
        legacyServiceHistory.map((record) =>
          addDoc(serviceCol, {
            date: record.date ?? '',
            shopName: record.shopName ?? '',
            cost: Number(record.cost) || 0,
            distanceAtService: Number(record.distanceAtService) || 0,
            hoursAtService: Number(record.hoursAtService) || 0,
            serviceType: record.serviceType ?? 'minor',
            type: 'service',
            migratedAt: serverTimestamp(),
          })
        )
      );
    }

    // Migrate RepairHistory
    if (Array.isArray(legacyRepairHistory) && legacyRepairHistory.length > 0) {
      const repairCol = collection(db, 'users', user.uid, 'repairHistory');
      await Promise.all(
        legacyRepairHistory.map((record) =>
          addDoc(repairCol, {
            date: record.date ?? '',
            shopName: record.shopName ?? '',
            cost: Number(record.cost) || 0,
            distanceAtService: Number(record.distanceAtService) || 0,
            hoursAtService: Number(record.hoursAtService) || 0,
            description: record.description ?? '',
            type: 'repair',
            migratedAt: serverTimestamp(),
          })
        )
      );
    }

    // Remove legacy localStorage keys
    localStorage.removeItem(LS_BIKE_DATA);
    localStorage.removeItem(LS_SERVICE_HISTORY);
    localStorage.removeItem(LS_REPAIR_HISTORY);

    // Mark migration as complete
    localStorage.setItem(MIGRATION_FLAG, 'true');

    console.info('[Trail Brew] Legacy bike data migrated to Firestore.');
  } catch (err) {
    // Do not set the flag — allow retry on next load
    console.error('[Trail Brew] Migration failed, will retry next session:', err);
  }
}
