import "./AppBar.css";
import type { User } from "../../services/firebaseService";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppBarContext } from "./AppBar.Context";
import { useEffect } from "react";
import { AccountMenu } from "./AccountMenu";

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

        <AccountMenu user={user} />
      </div>
    </div>
  );
};

interface Props {
  user: User;
}
