import { useId, useRef, useState, type FormEvent } from "react";
import {
  emailErrorMessage,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  type EmailAction,
} from "../../services/authService";
import { useMessages } from "../../i18n/i18n";
import { emailFormMessages } from "./messages";

// Firebase's own minimum is 6; asking for 8 costs nothing and is safer.
const MIN_PASSWORD_LENGTH = 8;
const looksLikeEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

type Mode = "signIn" | "signUp";

/** Signing in or creating an account with an email and a password. */
export const EmailSignIn = () => {
  const t = useMessages(emailFormMessages);
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "info"; text: string }>();
  const emailRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const emailId = useId();
  const passwordId = useId();
  const hintId = useId();

  async function run(action: EmailAction, task: () => Promise<unknown>, done?: string) {
    setBusy(true);
    setFeedback(undefined);
    try {
      await task();
      // Signing in moves on to the app by itself; only a reset needs a message.
      if (done) setFeedback({ kind: "info", text: done });
    } catch (error) {
      setFeedback({ kind: "error", text: emailErrorMessage(error, action) });
    } finally {
      setBusy(false);
    }
  }

  // Checked here rather than by the browser, so the messages are in the app's language.
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!looksLikeEmail(email)) return setFeedback({ kind: "error", text: t.invalidEmail });
    if (mode === "signUp" && password.length < MIN_PASSWORD_LENGTH) {
      return setFeedback({ kind: "error", text: t.shortPassword });
    }
    if (!password) return setFeedback({ kind: "error", text: t.enterPassword });
    if (mode === "signUp") void run("signUp", () => signUpWithEmail(email, password));
    else void run("signIn", () => signInWithEmail(email, password));
  }

  function onForgot() {
    if (!looksLikeEmail(email)) {
      setFeedback({ kind: "error", text: t.enterEmailFirst });
      emailRef.current?.focus();
      return;
    }
    void run("reset", () => sendPasswordReset(email), t.resetSent(email.trim()));
  }

  function switchTo(next: Mode) {
    setMode(next);
    setFeedback(undefined);
    emailRef.current?.focus();
  }

  return (
    <form className="Login-email" onSubmit={onSubmit} noValidate aria-labelledby={titleId} aria-busy={busy}>
      <h3 className="Login-email_title" id={titleId}>
        {mode === "signUp" ? t.titleSignUp : t.titleSignIn}
      </h3>
      <label htmlFor={emailId}>{t.email}</label>
      {/* Opened on request, so taking focus here is expected. */}
      <input
        ref={emailRef}
        id={emailId}
        type="email"
        autoComplete="username"
        inputMode="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor={passwordId}>{t.password}</label>
      <div className="Login-email_password">
        <input
          id={passwordId}
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "signUp" ? "new-password" : "current-password"}
          aria-describedby={mode === "signUp" ? hintId : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="ghost"
          aria-pressed={showPassword}
          onClick={() => setShowPassword((s) => !s)}
        >
          {showPassword ? t.hide : t.show}
        </button>
      </div>
      {mode === "signUp" ? (
        <span className="Login-email_hint" id={hintId}>
          {t.passwordHint}
        </span>
      ) : null}

      {feedback ? (
        <p
          className={`Login-email_feedback Login-email_feedback-${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      ) : null}

      <button type="submit" className="Login-button" disabled={busy}>
        {mode === "signUp" ? t.createAccount : t.signIn}
      </button>

      <div className="Login-email_links">
        {/* The same button for both modes, so it keeps focus when its text changes. */}
        <button
          type="button"
          className="ghost"
          disabled={busy}
          onClick={() => switchTo(mode === "signIn" ? "signUp" : "signIn")}
        >
          {mode === "signIn" ? t.newHere : t.haveAccount}
        </button>
        {mode === "signIn" ? (
          <button type="button" className="ghost" onClick={onForgot} disabled={busy}>
            {t.forgot}
          </button>
        ) : null}
      </div>
    </form>
  );
};
