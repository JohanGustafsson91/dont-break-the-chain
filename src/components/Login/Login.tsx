import { login } from "../../services/authService";
import { LOG } from "../../utils/logger";
import "./Login.css";

export const Login = () => {
  const handleLogin = async () => {
    try {
      await login({ provider: "github" });
    } catch (error) {
      LOG.error("GitHub Login Failed:", { error });
    }
  };

  return (
    <div className="page Login-container">
      <h1 className="Login-title">Don't Break The Chain</h1>
      <h2 className="Login-subtitle">
        Build habits, stay consistent, and keep your streak alive!
      </h2>
      <button className="Login-button" type="button" onClick={handleLogin}>
        Login with GitHub
      </button>
    </div>
  );
};
