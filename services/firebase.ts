// src/services/firebase.ts
// =============================================================================
// RASHTRA FIREBASE AUTH SERVICE (redirect-based Google auth)
// =============================================================================
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';

// ── Config from environment variables (Vite exposes VITE_ prefix) ──────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const REQUIRED_KEYS: (keyof typeof firebaseConfig)[] = [
  'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId',
];

// Optional-safe declarations
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

try {
  const missing = REQUIRED_KEYS.filter(k => !firebaseConfig[k]);
  if (missing.length > 0) {
    console.warn(
      `[Firebase] Missing env vars: ${missing
        .map(k => `VITE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`)
        .join(', ')}. Auth may not work. Add credentials to .env.`
    );
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
} catch (e) {
  console.warn('[Firebase] Initialization failed.', e);
}

// ── Auth result type ─────────────────────────────────────────────────────────
export interface AuthResult {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: 'google' | 'email';
}

function mapFirebaseUser(user: FirebaseUser, provider: 'google' | 'email'): AuthResult {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    provider,
  };
}

// ── Google Sign-In (Popup-based) ─────────────────────────────────────────────
// Using popup instead of redirect — redirect silently fails in modern browsers
// due to cross-origin storage (third-party cookie) restrictions blocking
// getRedirectResult() from reading back the pending auth state.
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase not initialised. Check your .env credentials.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return mapFirebaseUser(result.user, 'google');
}

// ── Email/Password Sign-In ───────────────────────────────────────────────────
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!auth) throw new Error('Firebase not initialised. Check your .env credentials.');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(result.user, 'email');
}

// ── Email/Password Register ──────────────────────────────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  if (!auth) throw new Error('Firebase not initialised. Check your .env credentials.');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
    // reload user profile if needed
  }
  return mapFirebaseUser(result.user, 'email');
}

// ── Forgot Password ───────────────────────────────────────────────────────────
export async function sendForgotPasswordEmail(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase not initialised. Check your .env credentials.');
  await sendPasswordResetEmail(auth, email);
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export async function firebaseSignOut(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

// ── Auth State Listener ───────────────────────────────────────────────────────
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

// export raw auth in case other parts need it (optional)
export { auth };