import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

const LS_KEY = 'trailbrew_ridden_trails';

function readLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeLocalStorage(set) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

export function useRiddenTrails() {
  const { user } = useAuth();
  const [riddenTrails, setRiddenTrails] = useState(() => readLocalStorage());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === undefined) return; // still loading auth

    if (!user) {
      // Signed out — use localStorage
      setRiddenTrails(readLocalStorage());
      return;
    }

    // Signed in — live subscription so rides logged elsewhere (useRideLog,
    // another device) appear without a reload.
    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const ids = snap.data()?.riddenTrails ?? [];
        setRiddenTrails(new Set(ids));
        setLoading(false);
      },
      (err) => {
        console.error('[useRiddenTrails] snapshot error:', err);
        // Fallback to localStorage on error
        setRiddenTrails(readLocalStorage());
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user === undefined ? 'loading' : user?.uid ?? 'guest']); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRidden = (trailId) => {
    const adding = !riddenTrails.has(trailId);

    // Optimistic update
    setRiddenTrails((prev) => {
      const next = new Set(prev);
      if (adding) next.add(trailId);
      else next.delete(trailId);
      if (!user) writeLocalStorage(next);
      return next;
    });

    if (user) {
      updateDoc(doc(db, 'users', user.uid), {
        riddenTrails: adding ? arrayUnion(trailId) : arrayRemove(trailId),
      }).catch((err) => {
        console.error('[useRiddenTrails] Failed to toggle trail, reverting:', err);
        // Revert only this toggle — other trails toggled while the request
        // was in flight keep their optimistic state.
        setRiddenTrails((prev) => {
          const reverted = new Set(prev);
          if (adding) reverted.delete(trailId);
          else reverted.add(trailId);
          return reverted;
        });
      });
    }
  };

  const isRidden = (trailId) => riddenTrails.has(trailId);

  return { riddenTrails, toggleRidden, isRidden, loading };
}
