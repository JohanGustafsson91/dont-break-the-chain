import "./AccountMenu.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { User } from "../../services/firebaseService";
import { logout } from "../../services/authService";
import {
  deleteAccountAndData,
  deletionFailureMessage,
  downloadMyData,
} from "../../services/accountService";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { markAccountDeleted } from "../../shared/accountDeletedNotice";
import { useToast } from "../Toast/Toast.Context";
import { ReminderDialog } from "../ReminderDialog/ReminderDialog";
import { refreshTodayProgress, remindersAvailable, syncReminderToken } from "../../services/reminderService";
import { setLanguageSetting, useLanguage, useMessages, type LanguageSetting } from "../../i18n/i18n";
import { accountMenuMessages, languageNames } from "./messages";

export const AccountMenu = ({ user }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
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
    setIsConfirmingDelete(false);
    setIsDeleting(true);
    showToast(t.confirmIdentity);
    const result = await deleteAccountAndData();
    setIsDeleting(false);

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
          {user.email ? <p className="AccountMenu-who">{user.email}</p> : null}
          {remindersAvailable ? (
            <button
              type="button"
              className="AccountMenu-item"
              onClick={() => {
                setIsOpen(false);
                setIsReminderOpen(true);
              }}
            >
              {t.reminder}
            </button>
          ) : null}
          <button type="button" className="AccountMenu-item" onClick={onExport}>
            {t.exportData}
          </button>
          <button
            type="button"
            className="AccountMenu-item AccountMenu-item_danger"
            disabled={isDeleting}
            onClick={() => {
              setIsOpen(false);
              setIsConfirmingDelete(true);
            }}
          >
            {t.deleteAccount}
          </button>
          <hr />
          <Link className="AccountMenu-item" to="/privacy" onClick={() => setIsOpen(false)}>
            {t.privacy}
          </Link>
          <Link className="AccountMenu-item" to="/terms" onClick={() => setIsOpen(false)}>
            {t.terms}
          </Link>
          <button type="button" className="AccountMenu-item" onClick={logout}>
            {t.logOut}
          </button>
          <hr />
          <label className="AccountMenu-language">
            <span>{t.language}</span>
            <select
              value={setting}
              onChange={(e) => {
                setLanguageSetting(e.target.value as LanguageSetting);
                // Reminders are written in the chosen language; save it with them.
                void refreshTodayProgress();
              }}
            >
              <option value="auto">{t.automatic(languageNames[language])}</option>
              <option value="en">{languageNames.en}</option>
              <option value="sv">{languageNames.sv}</option>
            </select>
          </label>
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
          body={t.deleteBody}
          confirmLabel={t.deleteConfirm}
          onCancel={() => {
            setIsConfirmingDelete(false);
            triggerRef.current?.focus();
          }}
          onConfirm={onDelete}
        />
      ) : null}
    </div>
  );
};

interface Props {
  user: User;
}
