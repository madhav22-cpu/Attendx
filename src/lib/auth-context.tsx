import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { Role, UserProfile } from "./types";

type AuthContextValue = {
  /** Firebase Auth user, or null when signed out. */
  user: User | null;
  /** Firestore users/{uid} profile, or null when missing/not yet loaded. */
  profile: UserProfile | null;
  /** Convenience accessor for profile.role. */
  role: Role | null;
  /** True while the initial auth state / profile lookup is in flight. */
  loading: boolean;
  /** True once we know the user is signed in but has no Firestore profile. */
  profileMissing: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [profileResolved, setProfileResolved] = useState(false);

  // Firebase Auth is browser-only; onAuthStateChanged simply never fires
  // during SSR since this effect doesn't run on the server.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthResolved(true);
      if (!nextUser) {
        setProfile(null);
        setProfileResolved(true);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileResolved(false);
    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setProfile(snap.exists() ? ({ uid: user.uid, ...snap.data() } as UserProfile) : null);
        setProfileResolved(true);
      },
      (error) => {
        console.error("Failed to load user profile:", error);
        setProfile(null);
        setProfileResolved(true);
      },
    );
    return unsubscribe;
  }, [user]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const loading = !authResolved || (!!user && !profileResolved);

  const value: AuthContextValue = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    profileMissing: authResolved && !!user && profileResolved && !profile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
