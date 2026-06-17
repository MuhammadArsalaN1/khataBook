import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC3uvRJgY1guevDIazDvBnEHCowV70yC1I',
  authDomain: 'khatabook-5c951.firebaseapp.com',
  projectId: 'khatabook-5c951',
  storageBucket: 'khatabook-5c951.firebasestorage.app',
  messagingSenderId: '161465224114',
  appId: '1:161465224114:android:c42bfb977036154092f2ab',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// inMemoryPersistence keeps the session alive for the app lifetime.
// On React Native, the auth token is re-validated each cold start via onAuthStateChanged.
export const auth = initializeAuth(app, {
  persistence: inMemoryPersistence,
});

export const db = getFirestore(app);
