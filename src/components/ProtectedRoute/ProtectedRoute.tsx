import type { PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/authService";
import { AppBar } from "../AppBar/AppBar";

interface ProtectedRouteProps {
  redirectPath?: string;
  fromLogin?: true;
}

export const ProtectedRoute = ({
  redirectPath = "/login",
  fromLogin,
  children,
}: PropsWithChildren<ProtectedRouteProps>) => {
  const navigate = useNavigate();
  const { user, status } = useAuth();

  if (status === "PENDING") {
    return (
      <div className="page">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user && !fromLogin) {
    navigate(redirectPath);
    return null;
  }

  if (user && fromLogin) {
    navigate("/");
    return null;
  }

  return (
    <div>
      {user ? <AppBar user={user} /> : null}
      {children}
    </div>
  );
};

export default ProtectedRoute;
