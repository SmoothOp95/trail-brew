/**
 * @fileoverview useBikeData — Firestore-backed hook for all bike tracker data.
 *
 * Firestore schema:
 *   /users/{uid}                       ← user doc (existing, managed by useAuth)
 *     .bikeData        {BikeData}      ← merged field on user doc
 *     .stravaConnection {StravaConnection} ← merged field on user doc
 *   /users/{uid}/serviceHistory/{id}   ← ServiceRecord documents
 *   /users/{uid}/repairHistory/{id}    ← RepairRecord documents
 *
 * Pattern follows useRiddenTrails.js:
 *   - onSnapshot for live updates
 *   - Optimistic local state
 *   - Graceful unauthenticated fallback (returns defaults, writes are no-ops)
 */

import { useState, useEffect, useRef } from 'react';
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { DEFAULT_BIKE_DATA } from '../types/index';

// localStorage keys (same as migrate.js so guest data is migrated on sign-in)
const LS_BIKE_DATA = 'bikeTrackerData';
const LS_SERVICE_HISTORY = 'bikeServiceHistory';
const LS_REPAIR_HISTORY = 'bikeRepairHistory';

function lsParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function useBikeData() {
  const { user } = useAuth();

  const [bikeData, setBikeData] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [repairHistory, setRepairHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hold unsubscribe refs so we can clean up all listeners on user change
  const unsubRefs = useRef([]);

  useEffect(() => {
    // Clean up any previous listeners
    unsubRefs.current.forEach((unsub) => unsub());
    unsubRefs.current = [];

    if (user === undefined) return; // auth still loading

    if (!user) {
      // Guest mode — persist to localStorage so migration works on first sign-in
      setBikeData(lsParse(LS_BIKE_DATA, { ...DEFAULT_BIKE_DATA }));
      setServiceHistory(lsParse(LS_SERVICE_HISTORY, []));
      setRepairHistory(lsParse(LS_REPAIR_HISTORY, []));
      setLoading(false);
      return;
    }

    setLoading(true);

    const userRef = doc(db, 'users', user.uid);

    // 1. Live listener on the user document for bikeData + stravaConnection
    const unsubUser = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.data() ?? {};
        setBikeData(data.bikeData ?? { ...DEFAULT_BIKE_DATA });
        setLoading(false);
      },
      (err) => {
        // Unsubscribe immediately on error — Firebase retries failed snapshots
        // internally which can produce thousands of identical errors in a loop
        // when the path is invalid (e.g. empty projectId in config).
        console.error('[useBikeData] User snapshot error:', err);
        unsubUser();
        setBikeData({ ...DEFAULT_BIKE_DATA });
        setLoading(false);
      }
    );

    // 2. Live listener on serviceHistory subcollection
    const serviceQuery = query(
      collection(db, 'users', user.uid, 'serviceHistory'),
      orderBy('date', 'desc')
    );
    const unsubService = onSnapshot(
      serviceQuery,
      (snap) => {
        setServiceHistory(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      },
      (err) => {
        console.error('[useBikeData] serviceHistory snapshot error:', err);
        unsubService();
        setServiceHistory([]);
      }
    );

    // 3. Live listener on repairHistory subcollection
    const repairQuery = query(
      collection(db, 'users', user.uid, 'repairHistory'),
      orderBy('date', 'desc')
    );
    const unsubRepair = onSnapshot(
      repairQuery,
      (snap) => {
        setRepairHistory(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      },
      (err) => {
        console.error('[useBikeData] repairHistory snapshot error:', err);
        unsubRepair();
        setRepairHistory([]);
      }
    );

    unsubRefs.current = [unsubUser, unsubService, unsubRepair];

    return () => {
      unsubRefs.current.forEach((unsub) => unsub());
      unsubRefs.current = [];
    };
  }, [user === undefined ? 'loading' : user?.uid ?? 'guest']); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Merge partial updates into the bikeData field on the user document.
   * Optimistically updates local state before the Firestore round-trip.
   *
   * @param {Partial<import('../types/index').BikeData>} updates
   */
  const updateBikeData = async (updates) => {
    if (!user) {
      // Guest mode: merge into state and persist to localStorage
      setBikeData((prev) => {
        const next = { ...prev, ...updates };
        localStorage.setItem(LS_BIKE_DATA, JSON.stringify(next));
        return next;
      });
      return;
    }

    // Optimistic update
    setBikeData((prev) => ({ ...prev, ...updates }));

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bikeData: { ...(bikeData ?? DEFAULT_BIKE_DATA), ...updates },
      });
    } catch {
      // Revert on failure
      setBikeData((prev) => prev);
    }
  };

  /**
   * Log a completed service event and reset the bike's running totals.
   * The caller is responsible for setting totalDistance: 0, totalHours: 0
   * and lastServiceDate in the updates passed to updateBikeData separately,
   * OR pass them here via the optional bikeUpdates argument.
   *
   * @param {Omit<import('../types/index').ServiceRecord, 'id'>} record
   * @param {Partial<import('../types/index').BikeData>} [bikeUpdates]
   */
  const addServiceRecord = async (record, bikeUpdates = {}) => {
    if (!user) {
      // Guest mode: append to localStorage
      const payload = { ...record, type: 'service', id: `guest-${Date.now()}` };
      setServiceHistory((prev) => {
        const next = [payload, ...prev];
        localStorage.setItem(LS_SERVICE_HISTORY, JSON.stringify(next));
        return next;
      });
      if (Object.keys(bikeUpdates).length > 0) {
        await updateBikeData(bikeUpdates);
      }
      return;
    }

    const payload = {
      ...record,
      type: 'service',
      createdAt: serverTimestamp(),
    };

    await addDoc(
      collection(db, 'users', user.uid, 'serviceHistory'),
      payload
    );

    if (Object.keys(bikeUpdates).length > 0) {
      await updateBikeData(bikeUpdates);
    }
  };

  /**
   * Log an ad-hoc repair event. Does not reset running totals.
   *
   * @param {Omit<import('../types/index').RepairRecord, 'id'>} record
   */
  const addRepairRecord = async (record) => {
    if (!user) {
      // Guest mode: append to localStorage
      const payload = { ...record, type: 'repair', id: `guest-${Date.now()}` };
      setRepairHistory((prev) => {
        const next = [payload, ...prev];
        localStorage.setItem(LS_REPAIR_HISTORY, JSON.stringify(next));
        return next;
      });
      return;
    }

    const payload = {
      ...record,
      type: 'repair',
      createdAt: serverTimestamp(),
    };

    await addDoc(
      collection(db, 'users', user.uid, 'repairHistory'),
      payload
    );
  };

  return {
    bikeData,
    serviceHistory,
    repairHistory,
    loading,
    updateBikeData,
    addServiceRecord,
    addRepairRecord,
  };
}
