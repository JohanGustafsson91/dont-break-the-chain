import "./Toast.css";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ToastContext } from "./Toast.Context";

const AUTO_DISMISS_MS = 8000;

interface Toast {
  id: number;
  text: string;
}

/** One message at a time; a new one replaces the old. */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<Toast>();

  // A fresh id per call restarts the timer and re-announces a repeated message.
  const showToast = useCallback(
    (text: string) => setToast((prev) => ({ id: (prev?.id ?? 0) + 1, text })),
    [],
  );
  const hideToast = useCallback(() => setToast(undefined), []);
  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  useEffect(
    function autoDismiss() {
      if (!toast) return;
      const timer = setTimeout(hideToast, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    },
    [toast, hideToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Always in the DOM: screen readers often skip a live region that appears
          together with its text. */}
      <div className="Toast" role="status">
        {toast ? (
          <>
            <span key={toast.id}>{toast.text}</span>
            <button type="button" aria-label="Dismiss" onClick={hideToast}>
              ×
            </button>
          </>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
};
