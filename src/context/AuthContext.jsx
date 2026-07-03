import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, FALLBACK_INVITE_CODE } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Firestore users/{uid} doc (isAdmin, isBanned, etc.)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
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
      email: normalizedEmail,
      avatarUrl: '',
      isAdmin: false,
      isBanned: false,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', credential.user.uid), userDoc);
    setProfile(userDoc);

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
