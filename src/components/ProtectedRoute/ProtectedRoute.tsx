import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/authService";
import { AppBar } from "../AppBar/AppBar";
import { AUTH_STATUS } from "../../shared/constants";

export const ProtectedRoute = ({
  redirectPath = "/login",
  isLoginPage,
  children,
}: PropsWithChildren<ProtectedRouteProps>) => {
  const navigate = useNavigate();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === AUTH_STATUS.PENDING) {
      return;
    }

    const isUnauthenticatedOnProtectedPage = !user && !isLoginPage;
    if (isUnauthenticatedOnProtectedPage) {
      navigate(redirectPath);
      return;
    }

    const isAuthenticatedOnLoginPage = user && isLoginPage;
    if (isAuthenticatedOnLoginPage) {
      navigate("/");
    }
  }, [user, status, isLoginPage, redirectPath, navigate]);

  if (status === AUTH_STATUS.PENDING) {
    return (
      <div className="page page-center">
        <p className="loading">Loading</p>
      </div>
    );
  }

  const isUnauthenticatedOnProtectedPage = !user && !isLoginPage;
  if (isUnauthenticatedOnProtectedPage) {
    return null;
  }

  const isAuthenticatedOnLoginPage = user && isLoginPage;
  if (isAuthenticatedOnLoginPage) {
    return null;
  }

  return (
    <>
      {user ? <AppBar user={user} /> : null}
      {children}
    </>
  );
};

interface ProtectedRouteProps {
  redirectPath?: string;
  isLoginPage?: true;
}
