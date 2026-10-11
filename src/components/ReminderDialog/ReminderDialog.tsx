import "../ConfirmDialog/ConfirmDialog.css";
import "./ReminderDialog.css";
import { useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_REMINDER_HOUR,
  getReminderSettings,
  getReminderSupport,
  isOnForThisDevice,
  NotificationsBlockedError,
  turnOffRemindersOnThisDevice,
  turnOnReminders,
  updateReminderHour,
  type ReminderSupport,
} from "../../services/reminderService";
import { useToast } from "../Toast/Toast.Context";
import { getLanguage, getLocale, languageFromBrowser, useMessages } from "../../i18n/i18n";
import { reminderDialogMessages } from "./messages";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

// The browser's own locale when it speaks the app's language, so its 12- or 24-hour
// clock is kept (en-GB shows 19:00, not 07 PM); otherwise the app language's default.
const formatHour = (hour: number) =>
  new Date(2000, 0, 1, hour).toLocaleTimeString(
    languageFromBrowser([navigator.language]) === getLanguage() ? navigator.language : getLocale(),
    { hour: "2-digit", minute: "2-digit" },
  );

const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

type State =
  | { status: "loading" }
  | { status: "failed" }
  | {
      status: "loaded";
      support: ReminderSupport;
      isOn: boolean;
      savedHour?: number;
      savedTimeZone?: string;
    };

export const ReminderDialog = ({ onClose }: Props) => {
  const t = useMessages(reminderDialogMessages);
  const titleId = useId();
  const hourId = useId();
  const { showToast } = useToast();
  const [state, setState] = useState<State>({ status: "loading" });
  const [hour, setHour] = useState(DEFAULT_REMINDER_HOUR);
  const [isBusy, setIsBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(function focusDialogOnOpen() {
    // The menu item that opened it is gone, so focus would otherwise fall to the page.
    dialogRef.current?.focus();
  }, []);

  useEffect(function loadSettings() {
    (async () => {
      try {
        const [support, settings] = await Promise.all([
          getReminderSupport(),
          getReminderSettings(),
        ]);
        setHour(settings?.hour ?? DEFAULT_REMINDER_HOUR);
        setState({
          status: "loaded",
          support,
          isOn: isOnForThisDevice(settings),
          savedHour: settings?.hour,
          savedTimeZone: settings?.timeZone,
        });
      } catch (error) {
        console.error("Could not load reminder settings", { error });
        setState({ status: "failed" });
      }
    })();
  }, []);

  useEffect(
    function closeOnEscape() {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    },
    [onClose],
  );

  async function run(action: () => Promise<unknown>, success: string, failure: string) {
    setIsBusy(true);
    try {
      await action();
      showToast(success);
      onClose();
    } catch (error) {
      if (error instanceof NotificationsBlockedError) {
        showToast(t.blockedToast);
      } else {
        console.error(failure, { error });
        showToast(t.tryAgain(failure));
      }
      setIsBusy(false);
    }
  }

  // Called straight from the tap, because Safari only shows the permission prompt then.
  const onTurnOn = () =>
    run(
      () => turnOnReminders(hour),
      t.turnedOn(formatHour(hour)),
      t.turnOnFailed,
    );

  const onSave = () =>
    run(() => updateReminderHour(hour), t.saved(formatHour(hour)), t.saveFailed);

  const onTurnOff = () =>
    run(turnOffRemindersOnThisDevice, t.turnedOff, t.turnOffFailed);

  const message = (text: string) => (
    <>
      <span className="ConfirmDialog-body">{text}</span>
      <div className="ConfirmDialog-actions ReminderDialog-single">
        <button type="button" className="secondary" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </>
  );

  const content = () => {
    if (state.status === "loading") {
      return <span className="ConfirmDialog-body loading">{t.loading}</span>;
    }
    if (state.status === "failed") {
      return message(t.loadFailed);
    }
    if (state.support === "needs-install") {
      return message(t.needsInstall);
    }
    if (state.support === "unsupported") {
      return message(t.unsupported);
    }
    if (!state.isOn && Notification.permission === "denied") {
      return message(t.blocked);
    }

    const timeZoneChanged =
      state.isOn && state.savedTimeZone !== undefined && state.savedTimeZone !== deviceTimeZone();

    return (
      <>
        <span className="ConfirmDialog-body">{t.intro}</span>
        <div className="ReminderDialog-time">
          <label htmlFor={hourId}>{t.remindMeAt}</label>
          <select
            id={hourId}
            value={hour}
            disabled={isBusy}
            onChange={(e) => setHour(Number(e.target.value))}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
        <span className="ReminderDialog-note">
          {timeZoneChanged
            ? t.timeZoneChanged(state.savedTimeZone ?? "", deviceTimeZone())
            : t.timeZoneNote(deviceTimeZone())}
        </span>
        {state.isOn ? (
          <button
            type="button"
            className="ghost ReminderDialog-turn-off"
            disabled={isBusy}
            onClick={onTurnOff}
          >
            {t.turnOffHere}
          </button>
        ) : null}
        <div className="ConfirmDialog-actions">
          {state.isOn ? (
            <>
              <button type="button" className="secondary" disabled={isBusy} onClick={onClose}>
                {t.close}
              </button>
              <button
                type="button"
                disabled={isBusy || (hour === state.savedHour && !timeZoneChanged)}
                onClick={onSave}
              >
                {t.save}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="secondary" disabled={isBusy} onClick={onClose}>
                {t.cancel}
              </button>
              <button type="button" disabled={isBusy} onClick={onTurnOn}>
                {t.turnOn}
              </button>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="ConfirmDialog-backdrop">
      <div
        className="ConfirmDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <span className="ConfirmDialog-title" id={titleId}>
          {t.title}
        </span>
        {content()}
      </div>
    </div>
  );
};

interface Props {
  onClose: () => void;
}
