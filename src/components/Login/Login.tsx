import { useState } from "react";
import { Link } from "react-router-dom";
import {
  login,
  providerName,
  signInErrorMessage,
  type AuthProvider,
} from "../../services/authService";
import { AUTH_PROVIDERS } from "../../shared/constants";
import "./Login.css";

export const Login = () => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleLogin = async (provider: AuthProvider) => {
    setErrorMessage(undefined);
    try {
      await login({ provider });
    } catch (error) {
      const message = signInErrorMessage(error, provider);
      // Closing the sign-in window is a normal choice, not an error.
      if (message) console.error(`${providerName[provider]} login failed:`, { error });
      setErrorMessage(message);
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
      <label className="Login-consent" id="login-consent">
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
      <div className="Login-buttons">
        <button
          className="Login-button"
          type="button"
          onClick={() => handleLogin(AUTH_PROVIDERS.GOOGLE)}
          disabled={!hasAcceptedTerms}
          aria-describedby="login-consent"
        >
          Continue with Google
        </button>
        <button
          className="Login-button secondary"
          type="button"
          onClick={() => handleLogin(AUTH_PROVIDERS.GITHUB)}
          disabled={!hasAcceptedTerms}
          aria-describedby="login-consent"
        >
          Continue with GitHub
        </button>
      </div>
      {errorMessage ? (
        <p className="Login-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};
