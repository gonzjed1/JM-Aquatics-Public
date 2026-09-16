import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

/**
 * ============================================================================
 * DEMO GATE ONLY — THIS IS NOT SECURITY.
 *
 * The passcode ships in the app bundle, so anyone can read it. It exists so
 * the admin view can be shown in a demo before real auth lands. Replace it
 * with MSAL / Entra ID before this app handles anything real.
 *
 * Swapping in real auth means changing what sets `role` inside AuthProvider.
 * Every screen consumes the same `useAuth()` interface either way, so nothing
 * outside this file needs to change.
 * ============================================================================
 */
export const TEMP_ADMIN_PASSCODE = '69420';

export type Role = 'admin' | 'worker';

type AuthContextValue = {
  /** null means signed out — the login screen is the only reachable route. */
  role: Role | null;
  isSignedIn: boolean;
  signInAsWorker: () => void;
  /** Returns false when the passcode is wrong, so the caller can show an error. */
  signInAsAdmin: (passcode: string) => boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<Role | null>(null);

  const signInAsWorker = useCallback(() => setRole('worker'), []);

  const signInAsAdmin = useCallback((passcode: string) => {
    if (passcode.trim() !== TEMP_ADMIN_PASSCODE) {
      return false;
    }
    setRole('admin');
    return true;
  }, []);

  const signOut = useCallback(() => setRole(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      isSignedIn: role !== null,
      signInAsWorker,
      signInAsAdmin,
      signOut,
    }),
    [role, signInAsWorker, signInAsAdmin, signOut]
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
