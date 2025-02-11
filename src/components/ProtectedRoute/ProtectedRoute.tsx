import "./ProtectedRoute.css";
import type { PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { logout, useAuth } from "../../services/authService";

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
      {user ? (
        <div className="menu">
          {user.photoURL ? (
            <img alt="profile" src={user?.photoURL} className="menu-avatar" />
          ) : null}

          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      ) : null}
      {children}
    </div>
  );
};

export default ProtectedRoute;
