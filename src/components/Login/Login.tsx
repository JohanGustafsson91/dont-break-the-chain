import { useState } from "react";
import { Link } from "react-router-dom";
import { login } from "../../services/authService";
import { AUTH_PROVIDERS } from "../../shared/constants";
import "./Login.css";

export const Login = () => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const handleLogin = async () => {
    try {
      await login({ provider: AUTH_PROVIDERS.GITHUB });
    } catch (error) {
      console.error("GitHub Login Failed:", { error });
    }
  };

  return (
    <div className="page Login-container">
      <div className="Login-logo" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h1 className="Login-title">Don't Break The Chain</h1>
      <h2 className="Login-subtitle">
        Build habits, stay consistent, and keep your streak alive!
      </h2>
      <label className="Login-consent">
        <input
          type="checkbox"
          checked={hasAcceptedTerms}
          onChange={(e) => setHasAcceptedTerms(e.target.checked)}
        />
        <span>
          I accept the <Link to="/terms">terms of use</Link> and have read the{" "}
          <Link to="/privacy">privacy policy</Link>.
        </span>
      </label>
      <button
        className="Login-button"
        type="button"
        onClick={handleLogin}
        disabled={!hasAcceptedTerms}
      >
        Login with GitHub
      </button>
    </div>
  );
};
