/**
 * AuthService – wraps all Firebase Authentication calls.
 *
 * Components never call the Firebase SDK directly; they go through this
 * service so the auth backend can be swapped without touching UI code.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  onAuthStateChanged as fbOnAuthStateChanged,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export class AuthService {
  /** Sign in with a Google popup. Returns the Firebase User on success. */
  static async signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }

  /** Sign out the current user. */
  static async signOut(): Promise<void> {
    await fbSignOut(auth);
  }

  /** Set or update the display name on the current user. */
  static async setDisplayName(name: string): Promise<void> {
    if (!auth.currentUser) throw new Error("No authenticated user");
    await updateProfile(auth.currentUser, { displayName: name });
  }

  /** Subscribe to auth state changes. Returns an unsubscribe function. */
  static onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    return fbOnAuthStateChanged(auth, callback);
  }

  /** The currently signed-in user (may be null). */
  static get currentUser(): User | null {
    return auth.currentUser;
  }
}
