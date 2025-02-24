import "./AppBar.css";
import { logout } from "../../services/authService";
import type { User } from "../../services/firebaseService";
import { useLocation, useNavigate } from "react-router-dom";
import { BackArrowIcon } from "./BackArrowIcon";
import { LogoutIcon } from "./LogoutIcon";
import { useAppBarContext } from "./AppBar.Context";
import { useEffect } from "react";

export const AppBar = ({ user }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { childrenComponents, renderAppBarItems } = useAppBarContext();

  useEffect(
    function clearChildrenComponentsOnNewLocation() {
      location.pathname && renderAppBarItems(null);
    },
    [location.pathname, renderAppBarItems],
  );

  function goBack() {
    return navigate(-1);
  }

  return (
    <div className="AppBar">
      {location.pathname !== "/" ? <BackArrowIcon onClick={goBack} /> : null}

      {user.photoURL && location.pathname === "/" ? (
        <img alt="profile" src={user.photoURL} className="AppBar_avatar" />
      ) : null}

      <div className="AppBar-right">
        {childrenComponents}

        <button type="button" className="icon-button">
          <LogoutIcon onClick={logout} />
        </button>
      </div>
    </div>
  );
};

interface Props {
  user: User;
}
