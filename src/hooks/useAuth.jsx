import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still loading, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Create or update the /users/{uid} document on every sign-in.
        // Wrapped in try/catch so a Firestore failure never blocks auth state
        // from resolving — without this, a bad config leaves the app stuck in
        // the loading state forever.
        try {
          await setDoc(
            doc(db, 'users', firebaseUser.uid),
            {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              lastSeen: serverTimestamp(),
            },
            { merge: true } // merge so existing fields (ridden trails, notes) are never overwritten
          );
        } catch (err) {
          console.error('[useAuth] Failed to write user profile to Firestore:', err);
        }
      }
      setUser(firebaseUser ?? null);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, signOut: () => signOut(auth) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
