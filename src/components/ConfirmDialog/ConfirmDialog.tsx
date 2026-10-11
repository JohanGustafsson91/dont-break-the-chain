import "./ConfirmDialog.css";
import { useEffect, useId } from "react";
import { useMessages } from "../../i18n/i18n";
import { confirmDialogMessages } from "./messages";

export const ConfirmDialog = ({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props) => {
  const titleId = useId();
  const m = useMessages(confirmDialogMessages);

  useEffect(
    function closeOnEscape() {
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") onCancel();
      }

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    },
    [onCancel],
  );

  return (
    <div className="ConfirmDialog-backdrop">
      <div
        className="ConfirmDialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <span className="ConfirmDialog-title" id={titleId}>
          {title}
        </span>
        <span className="ConfirmDialog-body">{body}</span>
        <div className="ConfirmDialog-actions">
          <button type="button" className="secondary" onClick={onCancel} autoFocus>
            {m.cancel}
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}
