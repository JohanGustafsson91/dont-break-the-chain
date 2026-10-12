import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseService";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { forgetThisDevice } from "./reminderService";
import { AUTH_STATUS, AUTH_PROVIDERS } from "../shared/constants";
import { getLanguage, messagesFor } from "../i18n/i18n";
import { emailSignInMessages, signInMessages } from "./messages";

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

const googleProvider = new GoogleAuthProvider();
// Always show Google's account chooser, so on a shared device the person who ticked
// the terms box doesn't land silently in someone else's still signed-in account.
googleProvider.setCustomParameters({ prompt: "select_account" });

const providers: Record<AuthProvider, GithubAuthProvider | GoogleAuthProvider> = {
  [AUTH_PROVIDERS.GITHUB]: new GithubAuthProvider(),
  [AUTH_PROVIDERS.GOOGLE]: googleProvider,
};

const providerByFirebaseId: Record<string, AuthProvider> = {
  "github.com": AUTH_PROVIDERS.GITHUB,
  "google.com": AUTH_PROVIDERS.GOOGLE,
};

// `?? []`: test doubles of a user often leave providerData out.
const providerIds = (user: User) => (user.providerData ?? []).map((p) => p.providerId);

const federatedProvider = (user: User) =>
  providerIds(user).map((id) => providerByFirebaseId[id]).find((p) => p !== undefined);

/** Signs in with email and password only, so confirming it's them takes the password. */
export const usesPassword = (user: User) =>
  !federatedProvider(user) && providerIds(user).includes("password");

/**
 * Firebase asks for a fresh sign-in before sensitive actions like deleting the account:
 * the Google or GitHub window, or the password for an email account.
 */
export const reauthenticate = (user: User, password?: string) => {
  const provider = federatedProvider(user);
  if (provider) return reauthenticateWithPopup(user, providers[provider]);
  if (usesPassword(user) && user.email && password !== undefined) {
    return reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  }
  throw new Error("Unsupported sign-in provider");
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
  // Otherwise this device would keep getting reminders for the account.
  await forgetThisDevice();
  await signOut(auth);
};

export const login = ({ provider }: { provider: AuthProvider }) => {
  const authProvider = providers[provider];
  if (!authProvider) {
    throw new Error(`Provider ${provider} is not supported yet`);
  }

  return signInWithPopup(auth, authProvider);
};

// Emails from Firebase (verification, password reset) in the app's language.
const setEmailLanguage = () => {
  auth.languageCode = getLanguage();
};

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

/**
 * Signs the new account in and sends the verification email. Until the address is
 * verified the rules keep the account out of all data, so the app asks to verify first
 * (a failed send can be retried from there).
 */
export const signUpWithEmail = async (email: string, password: string) => {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  setEmailLanguage();
  await sendEmailVerification(user).catch((error) => {
    console.warn("Could not send the verification email", { error });
  });
  return user;
};

export const resendVerification = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  setEmailLanguage();
  return sendEmailVerification(user);
};

/** After the link was opened elsewhere: reloads the user and gets a token that says so. */
export const checkVerified = async () => {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  if (user.emailVerified) await user.getIdToken(true);
  return user.emailVerified;
};

/** An email account whose address isn't verified yet, which the rules keep out of all data. */
export const needsVerification = (user: User) => usesPassword(user) && !user.emailVerified;

/** Succeeds whether or not the account exists, so it never tells which emails have one. */
export const sendPasswordReset = async (email: string) => {
  setEmailLanguage();
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    // Only reported when enumeration protection is off; say the same as for a real account.
    if ((error as { code?: string })?.code !== "auth/user-not-found") throw error;
  }
};

export type EmailAction = "signIn" | "signUp" | "reset";

export const emailErrorMessage = (error: unknown, action: EmailAction): string => {
  const code = (error as { code?: string } | undefined)?.code;
  const t = messagesFor(emailSignInMessages);
  switch (code) {
    case "auth/invalid-email":
      return t.invalidEmail;
    case "auth/missing-password":
    case "auth/weak-password":
      return t.weakPassword;
    // With enumeration protection on, a wrong password and an unknown email look the same.
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return t.wrongCredentials;
    case "auth/email-already-in-use":
      return t.emailInUse;
    case "auth/too-many-requests":
      return t.tooManyAttempts;
    case "auth/network-request-failed":
      return messagesFor(signInMessages).networkFailed;
    default:
      return action === "reset" ? t.resetFailed : messagesFor(signInMessages).failed;
  }
};

/**
 * What to tell the user when signing in fails, or undefined when they simply closed
 * the window. Accounts are never linked automatically: an email that already belongs
 * to another way of signing in must use that one.
 */
export const signInErrorMessage = (
  error: unknown,
  attempted: AuthProvider,
): string | undefined => {
  const code = (error as { code?: string } | undefined)?.code;
  const other =
    attempted === AUTH_PROVIDERS.GITHUB ? AUTH_PROVIDERS.GOOGLE : AUTH_PROVIDERS.GITHUB;

  const t = messagesFor(signInMessages);
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return undefined;
    // The other provider, or an email and password: either way, the earlier way works.
    case "auth/account-exists-with-different-credential":
      return t.accountExists(providerName[other]);
    case "auth/popup-blocked":
      return t.popupBlocked;
    case "auth/network-request-failed":
      return t.networkFailed;
    default:
      return t.failed;
  }
};
