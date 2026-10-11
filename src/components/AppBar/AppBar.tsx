import "./AppBar.css";
import type { User } from "../../services/firebaseService";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppBarContext } from "./AppBar.Context";
import { useEffect } from "react";
import { AccountMenu } from "./AccountMenu";
import { useMessages } from "../../i18n/i18n";
import { accountMenuMessages } from "./messages";

export const AppBar = ({ user }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { childrenComponents, renderAppBarItems } = useAppBarContext();
  const t = useMessages(accountMenuMessages);
  const isHome = location.pathname === "/" || location.pathname === "/overview";
  // A habit opened from the overview goes back there.
  const backTo = (location.state as { from?: string } | null)?.from ?? "/";

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
        <button type="button" className="ghost" onClick={() => navigate(backTo)}>
          {backTo.startsWith("/overview") ? t.backToOverview : t.back}
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
