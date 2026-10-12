import "./VerifyEmail.css";
import { useState } from "react";
import type { User } from "firebase/auth";
import { checkVerified, logout, resendVerification } from "../../services/authService";
import { useMessages } from "../../i18n/i18n";
import { verifyEmailMessages } from "./messages";

/** Shown instead of the app to an email account until its address is verified. */
export const VerifyEmail = ({ user }: { user: User }) => {
  const t = useMessages(verifyEmailMessages);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "info"; text: string }>();

  async function onVerified() {
    setBusy(true);
    setFeedback(undefined);
    try {
      // A fresh start picks up the verified token everywhere, rules included.
      if (await checkVerified()) window.location.assign("/");
      else setFeedback({ kind: "error", text: t.notYet });
    } catch {
      setFeedback({ kind: "error", text: t.notYet });
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    setBusy(true);
    setFeedback(undefined);
    try {
      await resendVerification();
      setFeedback({ kind: "info", text: t.resent });
    } catch {
      setFeedback({ kind: "error", text: t.resendFailed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page VerifyEmail">
      <h1>{t.title}</h1>
      <p>{t.body(user.email ?? "")}</p>
      <button type="button" disabled={busy} onClick={onVerified}>
        {t.verified}
      </button>
      {feedback ? (
        <p
          className={`VerifyEmail-feedback VerifyEmail-feedback_${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      ) : null}
      <div className="VerifyEmail-links">
        <button type="button" className="ghost" disabled={busy} onClick={onResend}>
          {t.resend}
        </button>
        <button type="button" className="ghost" onClick={logout}>
          {t.signOut}
        </button>
      </div>
    </div>
  );
};
