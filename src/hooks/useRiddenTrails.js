import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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

    // Signed in — load from Firestore
    setLoading(true);
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        const data = snap.data();
        const ids = data?.riddenTrails ?? [];
        setRiddenTrails(new Set(ids));
      })
      .catch(() => {
        // Fallback to localStorage on error
        setRiddenTrails(readLocalStorage());
      })
      .finally(() => setLoading(false));
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRidden = (trailId) => {
    const newSet = new Set(riddenTrails);
    const adding = !newSet.has(trailId);
    if (adding) {
      newSet.add(trailId);
    } else {
      newSet.delete(trailId);
    }

    // Optimistic update
    setRiddenTrails(newSet);

    if (!user) {
      writeLocalStorage(newSet);
    } else {
      const ref = doc(db, 'users', user.uid);
      updateDoc(ref, {
        riddenTrails: adding ? arrayUnion(trailId) : arrayRemove(trailId),
      }).catch(() => {
        // Revert on failure
        setRiddenTrails(riddenTrails);
      });
    }
  };

  const isRidden = (trailId) => riddenTrails.has(trailId);

  return { riddenTrails, toggleRidden, isRidden, loading };
}
