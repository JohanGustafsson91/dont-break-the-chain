import "./ConfirmDialog.css";
import { useEffect, useId, type ReactNode } from "react";
import { useMessages } from "../../i18n/i18n";
import { confirmDialogMessages } from "./messages";

export const ConfirmDialog = ({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  focusCancel = true,
  children,
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
        {children}
        <div className="ConfirmDialog-actions">
          <button type="button" className="secondary" onClick={onCancel} autoFocus={focusCancel}>
            {m.cancel}
          </button>
          <button type="button" className="danger" onClick={onConfirm} disabled={confirmDisabled}>
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
  /** Extra content between the text and the buttons, e.g. a field to confirm with. */
  children?: ReactNode;
  confirmDisabled?: boolean;
  /** Off when the content has a field to fill in first, which takes focus itself. */
  focusCancel?: boolean;
}
