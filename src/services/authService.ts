import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

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
