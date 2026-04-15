import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// import { getStorage } from 'firebase/storage'; // Storage disabled — bucket not provisioned
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fail fast if any required config value is missing. An empty projectId silently
// produces double-slash Firestore paths (projects//databases/...) which cause a
// cascade of ~1000 errors. Better to surface this immediately at startup.
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missingKeys.length > 0) {
  throw new Error(
    `Firebase config incomplete — missing: ${missingKeys.join(', ')}. ` +
    'Ensure all VITE_FIREBASE_* environment variables are set before building.'
  );
}

const app = initializeApp(firebaseConfig);

// Firestore with offline persistence (IndexedDB).
// Guard against double-init during Vite HMR in development.
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache() });
} catch {
  db = getFirestore(app);
}
export { db };

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Storage disabled — bucket not provisioned. Re-enable by uncommenting these
// two lines and the getStorage import above once a bucket is created in
// Firebase Console → Storage → Get started.
// export const storage = getStorage(app);

export default app;
