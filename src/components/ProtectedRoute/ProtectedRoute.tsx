import type { PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/authService";
import { AppBar } from "../AppBar/AppBar";

export const ProtectedRoute = ({
  redirectPath = "/login",
  isLoginPage,
  children,
}: PropsWithChildren<ProtectedRouteProps>) => {
  const navigate = useNavigate();
  const { user, status } = useAuth();

  if (status === "PENDING") {
    return (
      <div className="page page-center">
        <p className="loading">Loading</p>
      </div>
    );
  }

  const isUnauthenticatedOnProtectedPage = !user && !isLoginPage;
  if (isUnauthenticatedOnProtectedPage) {
    navigate(redirectPath);
    return null;
  }

  const isAuthenticatedOnLoginPage = user && isLoginPage;
  if (isAuthenticatedOnLoginPage) {
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

interface ProtectedRouteProps {
  redirectPath?: string;
  isLoginPage?: true;
}

export default ProtectedRoute;
