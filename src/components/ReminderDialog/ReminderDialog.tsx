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

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const formatHour = (hour: number) =>
  new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

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
        showToast("Notifications are blocked. Allow them for this site in your settings.");
      } else {
        console.error(failure, { error });
        showToast(`${failure} Please try again.`);
      }
      setIsBusy(false);
    }
  }

  // Called straight from the tap, because Safari only shows the permission prompt then.
  const onTurnOn = () =>
    run(
      () => turnOnReminders(hour),
      `Reminders are on. You'll get one at ${formatHour(hour)} when some of your habits aren't marked yet.`,
      "Couldn't turn on reminders.",
    );

  const onSave = () =>
    run(() => updateReminderHour(hour), `Reminder time saved: ${formatHour(hour)}.`, "Couldn't save the reminder time.");

  const onTurnOff = () =>
    run(turnOffRemindersOnThisDevice, "Reminders are off on this device.", "Couldn't turn off reminders.");

  const message = (text: string) => (
    <>
      <span className="ConfirmDialog-body">{text}</span>
      <div className="ConfirmDialog-actions ReminderDialog-single">
        <button type="button" className="secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );

  const content = () => {
    if (state.status === "loading") {
      return <span className="ConfirmDialog-body loading">Loading</span>;
    }
    if (state.status === "failed") {
      return message("Couldn't load your reminder settings. Check your connection and try again.");
    }
    if (state.support === "needs-install") {
      return message(
        "On iPhone and iPad, reminders only work in the installed app. Tap Share, then Add to Home Screen, and open the app from there.",
      );
    }
    if (state.support === "unsupported") {
      return message("This browser can't show notifications from websites.");
    }
    if (!state.isOn && Notification.permission === "denied") {
      return message(
        "Notifications are blocked for this site. Allow them in your browser or system settings to get reminders.",
      );
    }

    const timeZoneChanged =
      state.isOn && state.savedTimeZone !== undefined && state.savedTimeZone !== deviceTimeZone();

    return (
      <>
        <span className="ConfirmDialog-body">
          Get a notification when some of your habits aren't marked yet that day.
        </span>
        <div className="ReminderDialog-time">
          <label htmlFor={hourId}>Remind me at</label>
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
            ? `Reminders now follow ${state.savedTimeZone}. Saving switches them to this device's time zone (${deviceTimeZone()}).`
            : `The time applies to all your devices, in your time zone (${deviceTimeZone()}).`}
        </span>
        {state.isOn ? (
          <button
            type="button"
            className="ghost ReminderDialog-turn-off"
            disabled={isBusy}
            onClick={onTurnOff}
          >
            Turn off reminders on this device
          </button>
        ) : null}
        <div className="ConfirmDialog-actions">
          {state.isOn ? (
            <>
              <button type="button" className="secondary" disabled={isBusy} onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                disabled={isBusy || (hour === state.savedHour && !timeZoneChanged)}
                onClick={onSave}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button type="button" className="secondary" disabled={isBusy} onClick={onClose}>
                Cancel
              </button>
              <button type="button" disabled={isBusy} onClick={onTurnOn}>
                Turn on
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
          Daily reminder
        </span>
        {content()}
      </div>
    </div>
  );
};

interface Props {
  onClose: () => void;
}
