import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseService";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { AUTH_STATUS, AUTH_PROVIDERS } from "../shared/constants";

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

const googleProvider = new GoogleAuthProvider();
// Always show Google's account chooser, so on a shared device the person who ticked
// the terms box doesn't land silently in someone else's still signed-in account.
googleProvider.setCustomParameters({ prompt: "select_account" });

const providers: Record<AuthProvider, GithubAuthProvider | GoogleAuthProvider> = {
  [AUTH_PROVIDERS.GITHUB]: new GithubAuthProvider(),
  [AUTH_PROVIDERS.GOOGLE]: googleProvider,
};

export const providerName: Record<AuthProvider, string> = {
  [AUTH_PROVIDERS.GITHUB]: "GitHub",
  [AUTH_PROVIDERS.GOOGLE]: "Google",
};

export const useAuth = () => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return {
      status: AUTH_STATUS.PENDING,
      user: undefined,
    } as const;
  }

  if (error) {
    return {
      status: AUTH_STATUS.REJECTED,
      user: undefined,
    } as const;
  }

  return {
    status: AUTH_STATUS.RESOLVED,
    user,
  } as const;
};

export const logout = async () => {
  await signOut(auth);
};

export const login = ({ provider }: { provider: AuthProvider }) => {
  const authProvider = providers[provider];
  if (!authProvider) {
    throw new Error(`Provider ${provider} is not supported yet`);
  }

  return signInWithPopup(auth, authProvider);
};

/**
 * What to tell the user when signing in fails, or undefined when they simply closed
 * the window. Accounts are never linked automatically: an email that already belongs
 * to the other provider must sign in with that one.
 */
export const signInErrorMessage = (
  error: unknown,
  attempted: AuthProvider,
): string | undefined => {
  const code = (error as { code?: string } | undefined)?.code;
  // Exactly two providers are enabled (no email/password), so an email that exists
  // with a different credential belongs to the other one.
  const other =
    attempted === AUTH_PROVIDERS.GITHUB ? AUTH_PROVIDERS.GOOGLE : AUTH_PROVIDERS.GITHUB;

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return undefined;
    case "auth/account-exists-with-different-credential":
      return `An account with this email already exists. Sign in with ${providerName[other]} instead.`;
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.";
    case "auth/network-request-failed":
      return "Couldn't reach the sign-in service. Check your connection and try again.";
    default:
      return "Signing in didn't work. Please try again.";
  }
};
