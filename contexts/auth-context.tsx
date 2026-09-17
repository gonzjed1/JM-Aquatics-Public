import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

/**
 * ============================================================================
 * DEMO GATE ONLY — THIS IS NOT SECURITY.
 *
 * The accounts, the password and the PIN below ship in the app bundle, so
 * anyone can read them. They exist so every role can be shown in a demo before
 * real auth lands. Replace this with MSAL / Entra ID before the app handles
 * anything real: `signIn` and DEMO_ACCOUNTS go, everything else stays.
 *
 * Screens never learn about accounts. They read `role` (what the person may
 * do) and `userId` (who they are) from `useAuth()`, and both always come from
 * the matched account — never from which button was tapped.
 * ============================================================================
 */

/** Every demo account signs in with this. */
export const TEMP_DEMO_PASSWORD = '69420';
/** Second step on the Admin path. Same value as the password for the demo; kept separate so it can diverge. */
export const TEMP_ADMIN_PIN = '69420';

/** The three tiers. What each may do lives in constants/permissions.ts. */
export type Role = 'owner' | 'admin' | 'worker';

type DemoAccount = {
  email: string;
  password: string;
  /** The staff record in data/mock-seed.ts this account belongs to. */
  staffId: string;
  role: Role;
};

// Not shown anywhere on screen or in the README on purpose.
const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'owner@jm.demo', password: TEMP_DEMO_PASSWORD, staffId: 'jed', role: 'owner' },
  { email: 'admin@jm.demo', password: TEMP_DEMO_PASSWORD, staffId: 'mike', role: 'admin' },
  { email: 'employee@jm.demo', password: TEMP_DEMO_PASSWORD, staffId: 'sam', role: 'worker' },
];

function findAccount(email: string, password: string): DemoAccount | undefined {
  const wanted = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email === wanted && a.password === password);
}

type AuthContextValue = {
  /** null means signed out — the login screen is the only reachable route. */
  role: Role | null;
  /** Staff id of the signed-in person; null while signed out. */
  userId: string | null;
  isSignedIn: boolean;
  /** True when the email + password match an account. Changes nothing. */
  verifyCredentials: (email: string, password: string) => boolean;
  /** True when the PIN is right. Changes nothing. */
  verifyPin: (pin: string) => boolean;
  /** Signs in as the account those credentials belong to. False if they match nothing. */
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<{ role: Role; userId: string } | null>(null);

  const verifyCredentials = useCallback(
    (email: string, password: string) => findAccount(email, password) !== undefined,
    []
  );

  const verifyPin = useCallback((pin: string) => pin.trim() === TEMP_ADMIN_PIN, []);

  const signIn = useCallback((email: string, password: string) => {
    const account = findAccount(email, password);
    if (!account) return false;
    setSession({ role: account.role, userId: account.staffId });
    return true;
  }, []);

  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      role: session?.role ?? null,
      userId: session?.userId ?? null,
      isSignedIn: session !== null,
      verifyCredentials,
      verifyPin,
      signIn,
      signOut,
    }),
    [session, verifyCredentials, verifyPin, signIn, signOut]
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
