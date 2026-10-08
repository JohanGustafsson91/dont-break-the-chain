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

export const AccountMenu = ({ user }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [status, setStatus] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    setStatus(undefined);
    try {
      await downloadMyData();
    } catch (error) {
      console.error("Could not export data", { error });
      setStatus("Exporting your data failed. Please try again.");
    }
  }

  async function onDelete() {
    setIsConfirmingDelete(false);
    setIsDeleting(true);
    setStatus("Confirm it's you in the sign-in window to delete your account…");
    const result = await deleteAccountAndData();
    setIsDeleting(false);

    if (result.ok) {
      // Signing out sends the app to the login page, which shows the notice.
      markAccountDeleted();
      return;
    }
    console.error("Could not delete account", { result });
    setStatus(deletionFailureMessage(result));
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
        aria-label="Account menu"
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
          <button type="button" className="AccountMenu-item" onClick={onExport}>
            Export my data
          </button>
          <button
            type="button"
            className="AccountMenu-item AccountMenu-item_danger"
            disabled={isDeleting}
            onClick={() => {
              setIsOpen(false);
              setStatus(undefined);
              setIsConfirmingDelete(true);
            }}
          >
            Delete my account
          </button>
          <hr />
          <Link className="AccountMenu-item" to="/privacy" onClick={() => setIsOpen(false)}>
            Privacy policy
          </Link>
          <Link className="AccountMenu-item" to="/terms" onClick={() => setIsOpen(false)}>
            Terms of use
          </Link>
          <button type="button" className="AccountMenu-item" onClick={logout}>
            Log out
          </button>
        </div>
      ) : null}

      {/* Always in the DOM: screen readers often skip a live region that appears
          together with its text. */}
      <div className="AccountMenu-status" role="status">
        {status ? (
          <>
            <span>{status}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setStatus(undefined)}>
              ×
            </button>
          </>
        ) : null}
      </div>

      {isConfirmingDelete ? (
        <ConfirmDialog
          title="Delete your account?"
          body="All your habits, days and notes are deleted for good, and your account is removed. Export your data first if you want a copy. You'll be asked to sign in again to confirm. Access you gave the app in your Google or GitHub account can be removed there."
          confirmLabel="Delete everything"
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
