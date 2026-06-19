import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// Copy this file to firebase.ts and fill in your Firebase credentials
// Get these from: https://console.firebase.google.com/ → Project Settings
const firebaseConfig = {
  apiKey: 'AIzaSy...YOUR_API_KEY_HERE',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.firebasestorage.app',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcd1234efgh5678',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: inMemoryPersistence,
});

// experimentalForceLongPolling is required for React Native / Expo Go
// because the default gRPC transport isn't available outside a native build.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
