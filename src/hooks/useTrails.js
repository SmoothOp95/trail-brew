import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sortTrailsByDifficulty } from '../utils/trailDifficulty';

/**
 * Live trail catalogue from Firestore's public `trails` collection.
 * Used by the onboarding survey (Q7) so trail names are never hardcoded
 * into the component — see scripts/seedTrails.mjs for how the collection
 * gets populated.
 *
 * @returns {{ trails: Array, loading: boolean, error: Error|null }}
 */
export function useTrails() {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getDocs(collection(db, 'trails'))
      .then((snap) => {
        if (cancelled) return;
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTrails(sortTrailsByDifficulty(docs));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { trails, loading, error };
}
