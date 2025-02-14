import "./AppBar.css";
import { logout } from "../../services/authService";
import type { User } from "../../services/firebaseService";
import { useLocation, useNavigate } from "react-router-dom";
import { BackArrowIcon } from "./BackArrowIcon";
import { LogoutIcon } from "./LogoutIcon";

export const AppBar = ({ user }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();

  function goBack() {
    return navigate(-1);
  }

  return (
    <div className="app-bar">
      {location.pathname !== "/" ? <BackArrowIcon onClick={goBack} /> : null}

      {user.photoURL && location.pathname === "/" ? (
        <img alt="profile" src={user?.photoURL} className="app-bar_avatar" />
      ) : null}

      <button type="button" className="icon-button">
        <LogoutIcon onClick={logout} />
      </button>
    </div>
  );
};

interface Props {
  user: User;
}
