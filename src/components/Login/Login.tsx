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
import { setLanguageSetting, useLanguage, useMessages, type Language } from "../../i18n/i18n";
import { DemoCard } from "./DemoCard";
import { EmailSignIn } from "./EmailSignIn";
import { loginMessages } from "./messages";
import "./Login.css";

const LANGUAGES: { code: Language; label: string; name: string }[] = [
  { code: "en", label: "EN", name: "English" },
  { code: "sv", label: "SV", name: "Svenska" },
];

export const Login = () => {
  const t = useMessages(loginMessages);
  const { language } = useLanguage();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [showEmail, setShowEmail] = useState(false);
  const [accountDeleted] = useState(wasAccountDeleted);

  useEffect(
    function showDeletionNoticeOnce() {
      if (accountDeleted) clearAccountDeleted();
    },
    [accountDeleted],
  );

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
      <header className="Login-top">
        <span className="Login-brand">
          <span className="Login-logo" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Don't Break The Chain
        </span>
        <div className="Login-language" role="group" aria-label={t.language}>
          {LANGUAGES.map(({ code, label, name }) => (
            <button
              key={code}
              type="button"
              lang={code}
              aria-label={name}
              aria-pressed={language === code}
              onClick={() => setLanguageSetting(code)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="Login-intro">
        {accountDeleted ? (
          <p className="Login-notice" role="status">
            {t.accountDeleted}
          </p>
        ) : null}
        <h1 className="Login-title">
          {t.title} <span>{t.titleAccent}</span>
        </h1>
        <p className="Login-pitch">{t.pitch}</p>
        <DemoCard />
        {/* The same buttons sign up and sign in: a first sign-in creates the account. */}
        <h2 className="Login-cta" id="login-cta">
          {t.cta}
        </h2>
        <div className="Login-buttons" role="group" aria-labelledby="login-cta">
          <button className="Login-button" type="button" onClick={() => handleLogin(AUTH_PROVIDERS.GOOGLE)}>
            {t.continueWith("Google")}
          </button>
          <button
            className="Login-button secondary"
            type="button"
            onClick={() => handleLogin(AUTH_PROVIDERS.GITHUB)}
          >
            {t.continueWith("GitHub")}
          </button>
          {showEmail ? (
            <EmailSignIn />
          ) : (
            <button className="Login-button secondary" type="button" onClick={() => setShowEmail(true)}>
              {t.continueWithEmail}
            </button>
          )}
        </div>
        {/* Signing in is accepting the terms (see Terms); the data is handled under
            contract and legitimate interest, not consent, so no box to tick. */}
        <p className="Login-legal">
          {t.legalBefore}
          <Link to="/terms">{t.termsLink}</Link>
          {t.legalMiddle}
          <Link to="/privacy">{t.privacyLink}</Link>
          {t.legalAfter}
        </p>
        {errorMessage ? (
          <p className="Login-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <ul className="Login-trust">
          {t.trust.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </main>
    </div>
  );
};
