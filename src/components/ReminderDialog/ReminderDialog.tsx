import "../ConfirmDialog/ConfirmDialog.css";
import "./ReminderDialog.css";
import { useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_REMINDER_HOUR,
  getReminderSettings,
  getReminderSupport,
  isOnForThisDevice,
  MAX_REMINDER_HOURS,
  NotificationsBlockedError,
  reminderHours,
  turnOffRemindersOnThisDevice,
  turnOnReminders,
  updateReminderHours,
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

const sorted = (hours: number[]) => [...hours].sort((a, b) => a - b);
const sameHours = (a: number[], b: number[] = []) => sorted(a).join() === sorted(b).join();

// What a new row suggests, never the middle of the night. With at most two rows taken,
// one of these is always free.
const SUGGESTED_HOURS = [12, 18, 21];
const nextFreeHour = (hours: number[]) => SUGGESTED_HOURS.find((h) => !hours.includes(h)) ?? 12;

/** "12:00, 18:00 and 21:00", with the language's "and". */
const formatHours = (hours: number[], and: string) => {
  const times = sorted(hours).map(formatHour);
  return times.length < 2 ? times.join("") : `${times.slice(0, -1).join(", ")} ${and} ${times[times.length - 1]}`;
};

type State =
  | { status: "loading" }
  | { status: "failed" }
  | {
      status: "loaded";
      support: ReminderSupport;
      isOn: boolean;
      savedHours?: number[];
      savedTimeZone?: string;
    };

export const ReminderDialog = ({ onClose }: Props) => {
  const t = useMessages(reminderDialogMessages);
  const titleId = useId();
  const timesId = useId();
  const { showToast } = useToast();
  const [state, setState] = useState<State>({ status: "loading" });
  const [hours, setHours] = useState([DEFAULT_REMINDER_HOUR]);
  // The row to focus after adding or removing one: the button that was pressed may be gone.
  const [focusRow, setFocusRow] = useState<number>();
  const timesRef = useRef<HTMLDivElement>(null);
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
        setHours(settings ? reminderHours(settings) : [DEFAULT_REMINDER_HOUR]);
        setState({
          status: "loaded",
          support,
          isOn: isOnForThisDevice(settings),
          savedHours: settings ? reminderHours(settings) : undefined,
          savedTimeZone: settings?.timeZone,
        });
      } catch (error) {
        console.error("Could not load reminder settings", { error });
        setState({ status: "failed" });
      }
    })();
  }, []);

  useEffect(
    function focusRowAfterChange() {
      if (focusRow === undefined) return;
      timesRef.current?.querySelectorAll("select")[focusRow]?.focus();
      setFocusRow(undefined);
    },
    [focusRow],
  );

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
      () => turnOnReminders(hours),
      t.turnedOn(formatHours(hours, t.and), hours.length),
      t.turnOnFailed,
    );

  const onSave = () =>
    run(() => updateReminderHours(hours), t.saved(formatHours(hours, t.and), hours.length), t.saveFailed);

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
        <div className="ReminderDialog-times" role="group" aria-labelledby={timesId} ref={timesRef}>
          <span id={timesId}>{t.remindMeAt}</span>
          {hours.map((hour, i) => (
            <div className="ReminderDialog-time" key={i}>
              <select
                aria-label={t.reminderTime(i + 1)}
                value={hour}
                disabled={isBusy}
                onChange={(e) => setHours(hours.map((h, j) => (j === i ? Number(e.target.value) : h)))}
              >
                {HOURS.map((h) => (
                  // An hour can only be chosen once.
                  <option key={h} value={h} disabled={h !== hour && hours.includes(h)}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
              {hours.length > 1 ? (
                <button
                  type="button"
                  className="icon-button ReminderDialog-remove"
                  aria-label={t.removeTime(formatHour(hour))}
                  disabled={isBusy}
                  onClick={() => {
                    setHours(hours.filter((_, j) => j !== i));
                    setFocusRow(Math.min(i, hours.length - 2));
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              ) : null}
            </div>
          ))}
          {hours.length < MAX_REMINDER_HOURS ? (
            <button
              type="button"
              className="ghost ReminderDialog-add"
              disabled={isBusy}
              onClick={() => {
                setHours([...hours, nextFreeHour(hours)]);
                setFocusRow(hours.length);
              }}
            >
              <span aria-hidden="true">+ </span>
              {t.addTime}
            </button>
          ) : null}
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
                disabled={isBusy || (sameHours(hours, state.savedHours) && !timeZoneChanged)}
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
