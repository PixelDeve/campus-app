// ─────────────────────────────────────────────────────────────────────────
// FIREBASE INITIALIZATION
// Replace the values below with your Firebase project's web app config
// (Firebase Console → Project Settings → General → Your apps → SDK config).
// Never commit real keys to a public repo; use a .env file + import.meta.env
// in production (see .env.example at the project root).
// ─────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// initializeApp: boots the Firebase SDK using the config above.
export const app = initializeApp(firebaseConfig);

// Auth: handles email/password sign-up + sign-in for the invite-gated registration flow.
export const auth = getAuth(app);

// Firestore: stores users, posts, comments, flags, and the active school invite code.
export const db = getFirestore(app);

// ─────────────────────────────────────────────────────────────────────────
// SCHOOL INVITE CODE
// Fallback hardcoded value used only if the Firestore config doc is missing.
// The live/authoritative code lives in Firestore at config/inviteCode so an
// admin can rotate it from the Admin Panel without redeploying the app.
// ─────────────────────────────────────────────────────────────────────────
export const FALLBACK_INVITE_CODE = 'MY_SCHOOL_2026';
