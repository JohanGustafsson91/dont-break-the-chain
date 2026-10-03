import "./AppBar.css";
import { logout } from "../../services/authService";
import type { User } from "../../services/firebaseService";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppBarContext } from "./AppBar.Context";
import { useEffect } from "react";

export const AppBar = ({ user }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { childrenComponents, renderAppBarItems } = useAppBarContext();
  const isHome = location.pathname === "/";

  useEffect(
    function clearChildrenComponentsOnNewLocation() {
      renderAppBarItems(undefined);
    },
    [location.pathname, renderAppBarItems],
  );

  return (
    <div className="AppBar">
      {isHome ? (
        <div className="AppBar-brand">
          <span className="AppBar-logo" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>Don't Break The Chain</span>
        </div>
      ) : (
        <button type="button" className="ghost" onClick={() => navigate("/")}>
          ‹ Habits
        </button>
      )}

      <div className="AppBar-right">
        {childrenComponents}

        {user.photoURL && (
          <img alt="profile" src={user.photoURL} className="AppBar_avatar" />
        )}

        {isHome && (
          <button type="button" className="outline" onClick={logout}>
            Log out
          </button>
        )}
      </div>
    </div>
  );
};

interface Props {
  user: User;
}
