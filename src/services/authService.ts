import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseService";
import { GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { AUTH_STATUS, AUTH_PROVIDERS } from "../shared/constants";

export const githubProvider = new GithubAuthProvider();

type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];

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
  if (provider !== AUTH_PROVIDERS.GITHUB) {
    throw new Error(`Provider ${provider} is not supported yet`);
  }

  return signInWithPopup(auth, githubProvider);
};
