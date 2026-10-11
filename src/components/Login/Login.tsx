import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  login,
  providerName,
  signInErrorMessage,
  type AuthProvider,
} from "../../services/authService";
import { AUTH_PROVIDERS } from "../../shared/constants";
import {
  clearAccountDeleted,
  wasAccountDeleted,
} from "../../shared/accountDeletedNotice";
import {
  hasAcceptedCurrentTerms,
  rememberTermsAccepted,
} from "../../shared/termsAcceptance";
import { useMessages } from "../../i18n/i18n";
import { loginMessages } from "./messages";
import "./Login.css";

export const Login = () => {
  const t = useMessages(loginMessages);
  // Accepted earlier on this device: say so instead of showing a pre-ticked box, which
  // would wrongly tell the next person on a shared device that they ticked it.
  const [acceptedOnThisDevice] = useState(hasAcceptedCurrentTerms);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(acceptedOnThisDevice);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [accountDeleted] = useState(wasAccountDeleted);

  useEffect(
    function showDeletionNoticeOnce() {
      if (accountDeleted) clearAccountDeleted();
    },
    [accountDeleted],
  );

  const handleLogin = async (provider: AuthProvider) => {
    setErrorMessage(undefined);
    rememberTermsAccepted();
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
      <div className="Login-layout">
        <section className="Login-intro">
          <div className="Login-logo" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {accountDeleted ? (
            <p className="Login-notice" role="status">
              {t.accountDeleted}
            </p>
          ) : null}
          <h1 className="Login-title">Don't Break The Chain</h1>
          <p className="Login-subtitle">{t.tagline}</p>
          <p className="Login-pitch">{t.pitch}</p>
          {acceptedOnThisDevice ? (
            <p className="Login-accepted" id="login-consent">
              {t.acceptedBefore}
              <Link to="/terms">{t.termsLink}</Link>
              {t.acceptedMiddle}
              <Link to="/privacy">{t.privacyLink}</Link>
              {t.acceptedAfter}
            </p>
          ) : (
            <label className="Login-consent" id="login-consent">
              <input
                type="checkbox"
                checked={hasAcceptedTerms}
                onChange={(e) => setHasAcceptedTerms(e.target.checked)}
              />
              <span>
                {t.consentBefore}
                <Link to="/terms">{t.termsLink}</Link>
                {t.consentMiddle}
                <Link to="/privacy">{t.privacyLink}</Link>
                {t.consentAfter}
              </span>
            </label>
          )}
          <div className="Login-buttons">
            <button
              className="Login-button"
              type="button"
              onClick={() => handleLogin(AUTH_PROVIDERS.GOOGLE)}
              disabled={!hasAcceptedTerms}
              aria-describedby="login-consent"
            >
              {t.continueWith("Google")}
            </button>
            <button
              className="Login-button secondary"
              type="button"
              onClick={() => handleLogin(AUTH_PROVIDERS.GITHUB)}
              disabled={!hasAcceptedTerms}
              aria-describedby="login-consent"
            >
              {t.continueWith("GitHub")}
            </button>
          </div>
          {errorMessage ? (
            <p className="Login-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </section>

        <section className="Login-video">
          {/* Loaded only when played: free hosting allows little traffic a day. */}
          <video
            src="/promo/promo-v2.mp4"
            poster="/promo/promo-v2-poster.jpg"
            controls
            playsInline
            preload="none"
            aria-label={t.videoLabel}
          />
        </section>

        <section className="Login-features" aria-labelledby="login-features">
          <h2 id="login-features">{t.featuresTitle}</h2>
          <ul>
            {t.features.map((feature) => (
              <li key={feature.title}>
                <strong>{feature.title}</strong>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
