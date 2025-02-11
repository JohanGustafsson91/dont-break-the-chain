import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseService";
import { GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export const githubProvider = new GithubAuthProvider();

export const useAuth = () => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return {
      status: "PENDING",
      user: undefined,
    } as const;
  }

  if (error) {
    return {
      status: "REJECTED",
      user: undefined,
    } as const;
  }

  return {
    status: "RESOLVED",
    user,
  } as const;
};

export const logout = async () => {
  await signOut(auth);
};

export const login = ({ provider }: { provider: "github" }) => {
  if (provider !== "github") {
    throw new Error(`Invalid provider ${provider}`);
  }

  return signInWithPopup(auth, githubProvider);
};
