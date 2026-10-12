import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { needsVerification, useAuth } from "../../services/authService";
import { VerifyEmail } from "../VerifyEmail/VerifyEmail";
import { AppBar } from "../AppBar/AppBar";
import { AUTH_STATUS } from "../../shared/constants";
import { useMessages } from "../../i18n/i18n";
import { protectedRouteMessages } from "./messages";

export const ProtectedRoute = ({
  redirectPath = "/login",
  isLoginPage,
  children,
}: PropsWithChildren<ProtectedRouteProps>) => {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const m = useMessages(protectedRouteMessages);

  useEffect(() => {
    if (status === AUTH_STATUS.PENDING) {
      return;
    }

    const isUnauthenticatedOnProtectedPage = !user && !isLoginPage;
    if (isUnauthenticatedOnProtectedPage) {
      navigate(redirectPath, { replace: true });
      return;
    }

    const isAuthenticatedOnLoginPage = user && isLoginPage;
    if (isAuthenticatedOnLoginPage) {
      navigate("/", { replace: true });
    }
  }, [user, status, isLoginPage, redirectPath, navigate]);

  if (status === AUTH_STATUS.PENDING) {
    return (
      <div className="page page-center">
        <p className="loading">{m.loading}</p>
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

  // The rules keep an unverified email account out of all data, so ask to verify first.
  if (user && !isLoginPage && needsVerification(user)) {
    return <VerifyEmail user={user} />;
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
