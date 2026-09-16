import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

/**
 * ============================================================================
 * DEMO GATE ONLY — THIS IS NOT SECURITY.
 *
 * The passcode ships in the app bundle, so anyone can read it. It exists so
 * the owner and admin views can be shown in a demo before real auth lands.
 * Replace it with MSAL / Entra ID before this app handles anything real.
 *
 * Swapping in real auth means changing what sets `role` inside AuthProvider.
 * Every screen consumes the same `useAuth()` interface either way, so nothing
 * outside this file needs to change.
 * ============================================================================
 */
export const TEMP_ADMIN_PASSCODE = '69420';

/** The three tiers. What each may do lives in constants/permissions.ts. */
export type Role = 'owner' | 'admin' | 'worker';

/** The passcode-gated personas; workers sign in without one. */
export type StaffRole = Exclude<Role, 'worker'>;

type AuthContextValue = {
  /** null means signed out — the login screen is the only reachable route. */
  role: Role | null;
  isSignedIn: boolean;
  signInAsWorker: () => void;
  /** Returns false when the passcode is wrong, so the caller can show an error. */
  signInWithPasscode: (passcode: string, as: StaffRole) => boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<Role | null>(null);

  const signInAsWorker = useCallback(() => setRole('worker'), []);

  const signInWithPasscode = useCallback((passcode: string, as: StaffRole) => {
    if (passcode.trim() !== TEMP_ADMIN_PASSCODE) {
      return false;
    }
    setRole(as);
    return true;
  }, []);

  const signOut = useCallback(() => setRole(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      isSignedIn: role !== null,
      signInAsWorker,
      signInWithPasscode,
      signOut,
    }),
    [role, signInAsWorker, signInWithPasscode, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
