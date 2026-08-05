/**
 * @fileoverview useTrails — single source for the trail catalogue.
 *
 * Subscribes to the /trails Firestore collection (public read, admin write —
 * see firestore.rules). Until the collection is populated, or if Firestore is
 * unreachable, the bundled catalogue in src/data/trails.js is served instead,
 * so the app keeps working offline and before any cloud data exists.
 *
 * Trails with `archived: true` are hidden from riders without deleting the
 * document (ride history may still reference them).
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { trails as bundledTrails } from '../data/trails';

export function useTrails() {
  const [state, setState] = useState({
    trails: bundledTrails,
    source: 'bundled',
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'trails'),
      (snap) => {
        if (snap.empty) {
          setState({ trails: bundledTrails, source: 'bundled', loading: false });
          return;
        }
        const cloudTrails = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((t) => !t.archived)
          .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        setState({ trails: cloudTrails, source: 'firestore', loading: false });
      },
      (err) => {
        // Unsubscribe on error — Firestore retries internally, which floods the
        // console with identical errors when the path/config is invalid.
        console.error('[useTrails] snapshot error, serving bundled catalogue:', err);
        unsubscribe();
        setState({ trails: bundledTrails, source: 'bundled', loading: false });
      }
    );
    return unsubscribe;
  }, []);

  return state;
}
