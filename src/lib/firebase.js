import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

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

// Storage (ride screenshots)
export const storage = getStorage(app);

// Cloud Functions (europe-west1 to match Firestore region)
export const functions = getFunctions(app, 'europe-west1');

export default app;
