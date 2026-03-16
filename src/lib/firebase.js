import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ╔══════════════════════════════════════════════════════════╗
// ║  REPLACE the remaining values from Firebase Console     ║
// ║  Project Settings → General → Your apps → Config        ║
// ║  Project ID: trail-brew-33084                           ║
// ╚══════════════════════════════════════════════════════════╝
const firebaseConfig = {
  apiKey: 'AIzaSyAUihy3hm-OPvdUYyCGvcAeUFnNZT1HZjg',
  authDomain: 'trail-brew-33084.firebaseapp.com',
  projectId: 'trail-brew-33084',
  storageBucket: 'trail-brew-33084.firebasestorage.app',
  messagingSenderId: '570208307489',
  appId: '1:570208307489:web:039c89d600b425cdeb9660',
};

const app = initializeApp(firebaseConfig);

// Firestore with offline persistence
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
