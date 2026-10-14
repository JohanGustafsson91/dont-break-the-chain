import "./AccountMenu.css";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { User } from "../../services/firebaseService";
import { logout, usesPassword } from "../../services/authService";
import {
  deleteAccountAndData,
  deletionFailureMessage,
  downloadMyData,
} from "../../services/accountService";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { markAccountDeleted } from "../../shared/accountDeletedNotice";
import { useToast } from "../Toast/Toast.Context";
import { ReminderDialog } from "../ReminderDialog/ReminderDialog";
import { formatHour } from "../ReminderDialog/formatHour";
import {
  getReminderSettings,
  isOnForThisDevice,
  refreshTodayProgress,
  reminderHours,
  remindersAvailable,
  syncReminderToken,
} from "../../services/reminderService";
import { setLanguageSetting, useLanguage, useMessages, type LanguageSetting } from "../../i18n/i18n";
import { accountMenuMessages, languageNames } from "./messages";

// Stroke icons in the style of the rest of the app; decorative, the text says it all.
const icons = {
  bell: (
    <>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  logOut: (
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
    </>
  ),
};

const Icon = ({ name }: { name: keyof typeof icons }) => (
  <svg className="AccountMenu-icon" viewBox="0 0 24 24" aria-hidden="true">
    {icons[name]}
  </svg>
);

const LANGUAGE_SETTINGS: LanguageSetting[] = ["auto", "sv", "en"];

export const AccountMenu = ({ user }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // Email accounts confirm with their password instead of a sign-in window.
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const needsPassword = usesPassword(user);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  // This device's reminder times, shown next to the menu item; undefined while off.
  const [reminderTimes, setReminderTimes] = useState<number[]>();
  const reminderLabelId = useId();
  const reminderStatusId = useId();
  const languageId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { showToast, hideToast } = useToast();
  const t = useMessages(accountMenuMessages);
  const { setting, language } = useLanguage();

  // The menu is on every signed-in page, so this runs once when the app opens.
  useEffect(function keepReminderTokenFresh() {
    void syncReminderToken();
  }, []);

  useEffect(
    function loadReminderTimes() {
      if (!isOpen || !remindersAvailable) return;
      let isCurrent = true;
      getReminderSettings()
        .then((settings) => {
          if (isCurrent) setReminderTimes(settings && isOnForThisDevice(settings) ? reminderHours(settings) : undefined);
        })
        // Only a hint in the menu; the dialog says what went wrong if it matters.
        .catch(() => {});
      return () => {
        isCurrent = false;
      };
    },
    [isOpen],
  );

  useEffect(
    function closeOnOutsideClickOrEscape() {
      if (!isOpen) return;

      const onPointerDown = (e: PointerEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        setIsOpen(false);
        triggerRef.current?.focus();
      };

      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("keydown", onKeyDown);
      };
    },
    [isOpen],
  );

  const close = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  async function onExport() {
    close();
    try {
      await downloadMyData();
      showToast(t.exported);
    } catch (error) {
      console.error("Could not export data", { error });
      showToast(t.exportFailed);
    }
  }

  async function onDelete() {
    // An email account stays in the dialog while it checks the password, so a typo can
    // be fixed there; the others confirm in Google's or GitHub's window.
    if (!needsPassword) setIsConfirmingDelete(false);
    setIsDeleting(true);
    setPasswordError(undefined);
    if (!needsPassword) showToast(t.confirmIdentity);
    const result = await deleteAccountAndData(needsPassword ? password : undefined);
    setIsDeleting(false);

    if (!result.ok && needsPassword && result.step === "reauthenticate") {
      hideToast();
      setPasswordError(deletionFailureMessage(result));
      return;
    }
    setIsConfirmingDelete(false);
    setPassword("");

    if (result.ok) {
      // Signing out sends the app to the login page, which shows the notice. The
      // toast lives above the router, so the progress message must go explicitly.
      hideToast();
      markAccountDeleted();
      return;
    }
    console.error("Could not delete account", { result });
    showToast(deletionFailureMessage(result));
  }

  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <div
      className="AccountMenu"
      ref={rootRef}
      onBlur={(e) => {
        // Close when keyboard focus leaves the menu, e.g. tabbing past "Log out".
        if (isOpen && !rootRef.current?.contains(e.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="AccountMenu-trigger"
        aria-label={t.menu}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "account-menu" : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        {user.photoURL ? (
          <img alt="" src={user.photoURL} className="AppBar_avatar" />
        ) : (
          <span className="AppBar_avatar AccountMenu-initial">{initial}</span>
        )}
      </button>

      {isOpen ? (
        <div className="AccountMenu-panel" id="account-menu">
          <div className="AccountMenu-who">
            {user.photoURL ? (
              <img alt="" src={user.photoURL} className="AccountMenu-who_avatar" />
            ) : (
              <span className="AccountMenu-who_avatar">{initial}</span>
            )}
            <span className="AccountMenu-who_text">
              {user.displayName ? <b>{user.displayName}</b> : null}
              {user.email ? <span>{user.email}</span> : null}
            </span>
          </div>
          <hr />
          {remindersAvailable ? (
            <button
              type="button"
              className="AccountMenu-item"
              // The time is a description, so the item is still named just "Daily reminders".
              aria-labelledby={reminderLabelId}
              aria-describedby={reminderTimes ? reminderStatusId : undefined}
              onClick={() => {
                setIsOpen(false);
                setIsReminderOpen(true);
              }}
            >
              <Icon name="bell" />
              <span className="AccountMenu-item_text" id={reminderLabelId}>
                {t.reminder}
              </span>
              {reminderTimes ? (
                <span className="AccountMenu-pill" id={reminderStatusId}>
                  {formatHour(Math.min(...reminderTimes))}
                  {reminderTimes.length > 1 ? ` +${reminderTimes.length - 1}` : ""}
                </span>
              ) : null}
            </button>
          ) : null}
          <button type="button" className="AccountMenu-item" onClick={onExport}>
            <Icon name="download" />
            <span className="AccountMenu-item_text">{t.exportData}</span>
          </button>
          <div className="AccountMenu-label" id={languageId}>
            {t.language}
          </div>
          <div className="AccountMenu-languages" role="radiogroup" aria-labelledby={languageId}>
            {LANGUAGE_SETTINGS.map((option) => (
              <label key={option} className={setting === option ? "is-checked" : undefined}>
                <input
                  type="radio"
                  name="language"
                  value={option}
                  checked={setting === option}
                  // Says which language "Auto" picked; the button itself stays short.
                  aria-label={option === "auto" ? t.automatic(languageNames[language]) : undefined}
                  onChange={() => {
                    setLanguageSetting(option);
                    // Reminders are written in the chosen language; save it with them.
                    void refreshTodayProgress();
                  }}
                />
                {option === "auto" ? t.auto : languageNames[option]}
              </label>
            ))}
          </div>
          <hr />
          <button type="button" className="AccountMenu-item" onClick={logout}>
            <Icon name="logOut" />
            <span className="AccountMenu-item_text">{t.logOut}</span>
          </button>
          {/* Last, away from the everyday choices, so it isn't tapped by mistake. */}
          <button
            type="button"
            className="AccountMenu-item AccountMenu-item_danger"
            disabled={isDeleting}
            onClick={() => {
              setIsOpen(false);
              setIsConfirmingDelete(true);
            }}
          >
            <Icon name="trash" />
            <span className="AccountMenu-item_text">{t.deleteAccount}</span>
          </button>
          <hr />
          <div className="AccountMenu-links">
            <Link to="/privacy" onClick={() => setIsOpen(false)}>
              {t.privacy}
            </Link>
            <Link to="/terms" onClick={() => setIsOpen(false)}>
              {t.terms}
            </Link>
          </div>
        </div>
      ) : null}

      {isReminderOpen ? (
        <ReminderDialog
          onClose={() => {
            setIsReminderOpen(false);
            triggerRef.current?.focus();
          }}
        />
      ) : null}

      {isConfirmingDelete ? (
        <ConfirmDialog
          title={t.deleteTitle}
          body={needsPassword ? t.deleteBodyPassword : t.deleteBody}
          confirmLabel={t.deleteConfirm}
          confirmDisabled={isDeleting || (needsPassword && password === "")}
          focusCancel={!needsPassword}
          onCancel={() => {
            setIsConfirmingDelete(false);
            setPassword("");
            setPasswordError(undefined);
            triggerRef.current?.focus();
          }}
          onConfirm={onDelete}
        >
          {needsPassword ? (
            <form className="AccountMenu-password" onSubmit={(e) => e.preventDefault()}>
              {/* Lets password managers tell which saved login this is. */}
              <input type="email" autoComplete="username" value={user.email ?? ""} readOnly hidden />
              <label>
                <span>{t.password}</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  aria-invalid={passwordError ? true : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // Two fields and no submit button, so Enter doesn't submit by itself.
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password && !isDeleting) void onDelete();
                  }}
                />
              </label>
              {passwordError ? (
                <span className="AccountMenu-password_error" role="alert">
                  {passwordError}
                </span>
              ) : null}
            </form>
          ) : null}
        </ConfirmDialog>
      ) : null}
    </div>
  );
};

interface Props {
  user: User;
}
