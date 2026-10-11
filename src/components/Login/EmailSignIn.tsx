import { useId, useState, type FormEvent } from "react";
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

type Mode = "signIn" | "signUp";

/** Signing in or creating an account with an email and a password. */
export const EmailSignIn = () => {
  const t = useMessages(emailFormMessages);
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "info"; text: string }>();
  const emailId = useId();
  const passwordId = useId();

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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "signUp") void run("signUp", () => signUpWithEmail(email, password));
    else void run("signIn", () => signInWithEmail(email, password));
  }

  function onForgot() {
    if (!email.trim()) {
      setFeedback({ kind: "error", text: t.enterEmailFirst });
      return;
    }
    void run("reset", () => sendPasswordReset(email), t.resetSent(email.trim()));
  }

  function switchTo(next: Mode) {
    setMode(next);
    setFeedback(undefined);
  }

  return (
    <form className="Login-email" onSubmit={onSubmit}>
      <label htmlFor={emailId}>{t.email}</label>
      <input
        id={emailId}
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor={passwordId}>{t.password}</label>
      <input
        id={passwordId}
        type="password"
        autoComplete={mode === "signUp" ? "new-password" : "current-password"}
        required
        minLength={mode === "signUp" ? MIN_PASSWORD_LENGTH : undefined}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {mode === "signUp" ? <span className="Login-email_hint">{t.passwordHint}</span> : null}

      {feedback ? (
        <p className={`Login-email_feedback Login-email_feedback-${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>
          {feedback.text}
        </p>
      ) : null}

      <button type="submit" className="Login-button" disabled={busy}>
        {mode === "signUp" ? t.createAccount : t.signIn}
      </button>

      <div className="Login-email_links">
        {mode === "signIn" ? (
          <>
            <button type="button" className="ghost" onClick={() => switchTo("signUp")}>
              {t.newHere}
            </button>
            <button type="button" className="ghost" onClick={onForgot} disabled={busy}>
              {t.forgot}
            </button>
          </>
        ) : (
          <button type="button" className="ghost" onClick={() => switchTo("signIn")}>
            {t.haveAccount}
          </button>
        )}
      </div>
    </form>
  );
};
