import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, FALLBACK_INVITE_CODE } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Firestore users/{uid} doc (isAdmin, isBanned, name, bio, avatarUrl, etc.)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // Tear down any previous profile listener when the auth user changes.
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        // Live-subscribe to the user's own profile doc so edits (name, bio,
        // avatar) or admin actions (isAdmin/isBanned toggles) reflect
        // instantly everywhere in the app, without needing a reload.
        unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
          setProfile(snap.exists() ? snap.data() : null);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  /**
   * Fetches the currently-active invite code from Firestore (config/inviteCode),
   * falling back to the hardcoded constant if the doc doesn't exist yet.
   */
  async function getActiveInviteCode() {
    try {
      const snap = await getDoc(doc(db, 'config', 'inviteCode'));
      if (snap.exists() && snap.data().value) {
        return snap.data().value;
      }
    } catch (err) {
      // Fall through to hardcoded fallback if config read fails.
    }
    return FALLBACK_INVITE_CODE;
  }

  /**
   * Registers a new student account.
   * Validates: (1) email is a gmail.com address, (2) invite code matches the
   * school's active code — BOTH checks happen before createUserWithEmailAndPassword
   * is ever called, so invalid attempts never touch Firebase Auth.
   */
  async function register({ name, email, password, inviteCode }) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith('@gmail.com')) {
      throw new Error('Please use a valid @gmail.com address to register.');
    }

    const activeCode = await getActiveInviteCode();
    if (inviteCode.trim() !== activeCode) {
      throw new Error('Incorrect School Invite Code. Ask a staff member for the current code.');
    }

    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    await updateProfile(credential.user, { displayName: name });

    const userDoc = {
      name,
      bio: '',
      email: normalizedEmail,
      avatarUrl: '',
      isAdmin: false,
      isBanned: false,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', credential.user.uid), userDoc);
    // No need to setProfile manually here — the onSnapshot listener above
    // will pick up this newly-created doc automatically.

    return credential.user;
  }

  async function login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith('@gmail.com')) {
      throw new Error('Please use a valid @gmail.com address to sign in.');
    }
    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);

    const snap = await getDoc(doc(db, 'users', credential.user.uid));
    if (snap.exists() && snap.data().isBanned) {
      await signOut(auth);
      throw new Error('This account has been suspended. Contact a school admin.');
    }
    return credential.user;
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, register, login, logout, getActiveInviteCode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
