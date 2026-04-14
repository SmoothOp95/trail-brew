import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
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

  const signUpWithEmail = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    // Trigger a manual Firestore write since onAuthStateChanged may fire before displayName is set
    await setDoc(
      doc(db, 'users', credential.user.uid),
      {
        displayName,
        email: credential.user.email,
        photoURL: null,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );
    return credential.user;
  };

  const signInWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider
      value={{
        user,
        signOut: () => signOut(auth),
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
