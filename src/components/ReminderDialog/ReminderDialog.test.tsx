import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as reminderService from "../../services/reminderService";
import { ReminderDialog } from "./ReminderDialog";
import { ToastProvider } from "../Toast/Toast.Provider";
import { setLanguageSetting } from "../../i18n/i18n";

vi.mock("../../services/reminderService", async (importOriginal) => ({
  ...(await importOriginal<typeof reminderService>()),
  getReminderSupport: vi.fn(),
  getReminderSettings: vi.fn(),
  isOnForThisDevice: vi.fn(),
  turnOnReminders: vi.fn(),
  updateReminderHours: vi.fn(),
  turnOffRemindersOnThisDevice: vi.fn(),
}));

vi.mock("../../services/firebaseService", () => ({ app: {}, auth: {}, db: {} }));

// Saved from this device's time zone, so the tests behave the same on any machine.
const settings = {
  hour: 21,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  tokens: ["this-device"],
};

const renderDialog = () => {
  const onClose = vi.fn();
  render(
    <ToastProvider>
      <ReminderDialog onClose={onClose} />
    </ToastProvider>,
  );
  return { onClose };
};

describe("ReminderDialog - daily reminder on this device", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("Notification", { permission: "default" });
    vi.mocked(reminderService.getReminderSupport).mockResolvedValue("supported");
    vi.mocked(reminderService.getReminderSettings).mockResolvedValue(undefined);
    vi.mocked(reminderService.isOnForThisDevice).mockReturnValue(false);
  });

  it("should turn reminders on at the chosen hour", async () => {
    const { onClose } = renderDialog();
    expect(screen.getByRole("dialog", { name: "Daily reminders" })).toHaveFocus();

    const time = await screen.findByRole("combobox", { name: "Reminder 1" });
    expect(time).toHaveValue("20"); // the default
    await userEvent.selectOptions(time, "7");
    await userEvent.click(screen.getByRole("button", { name: "Turn on" }));

    expect(reminderService.turnOnReminders).toHaveBeenCalledWith([7]);
    expect(await screen.findByRole("status")).toHaveTextContent("Reminders are on.");
    expect(onClose).toHaveBeenCalled();
  });

  it("should change the time or turn off when reminders are already on here", async () => {
    vi.mocked(reminderService.getReminderSettings).mockResolvedValue(settings);
    vi.mocked(reminderService.isOnForThisDevice).mockReturnValue(true);
    const { unmount } = render(
      <ToastProvider>
        <ReminderDialog onClose={() => {}} />
      </ToastProvider>,
    );

    const time = await screen.findByRole("combobox", { name: "Reminder 1" });
    expect(time).toHaveValue("21");
    // There must always be a way out, also on a phone without an Escape key.
    expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled(); // nothing changed yet
    await userEvent.selectOptions(time, "8");
    await userEvent.click(save);
    expect(reminderService.updateReminderHours).toHaveBeenCalledWith([8]);
    unmount();

    const { onClose } = renderDialog();
    await userEvent.click(await screen.findByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
    expect(reminderService.turnOffRemindersOnThisDevice).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Turn off reminders on this device" }));
    expect(reminderService.turnOffRemindersOnThisDevice).toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent("Reminders are off on this device.");
  });

  it("should let the user choose up to three times, each only once", async () => {
    vi.mocked(reminderService.getReminderSettings).mockResolvedValue({ ...settings, hour: 12, hours: [12, 18] });
    vi.mocked(reminderService.isOnForThisDevice).mockReturnValue(true);
    vi.mocked(reminderService.updateReminderHours).mockResolvedValue(undefined);
    renderDialog();

    const times = await screen.findByRole("group", { name: "Remind me at" });
    expect(screen.getByRole("combobox", { name: "Reminder 1" })).toHaveValue("12");
    expect(screen.getByRole("combobox", { name: "Reminder 2" })).toHaveValue("18");
    // 12:00 is taken by the first reminder, so the second can't pick it.
    const second = screen.getByRole("combobox", { name: "Reminder 2" });
    expect(second.querySelector('option[value="12"]')).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Add a time" }));
    expect(screen.getByRole("combobox", { name: "Reminder 3" })).toHaveValue("21");
    // Three is the most.
    expect(within(times).queryByRole("button", { name: "Add a time" })).not.toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeEnabled();

    // Focus moves to the new time, since the add button is gone.
    expect(screen.getByRole("combobox", { name: "Reminder 3" })).toHaveFocus();

    // Back to the saved times: nothing to save. Focus stays in the list.
    await userEvent.click(screen.getByRole("button", { name: /^Remove the reminder at 0?9:00/ }));
    expect(save).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Reminder 2" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Add a time" }));

    await userEvent.click(screen.getByRole("button", { name: /^Remove the reminder at 12/ }));
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(reminderService.updateReminderHours).toHaveBeenCalledWith([18, 21]);
    expect(await screen.findByRole("status")).toHaveTextContent("Reminder times saved:");
  });

  it("should explain how to get reminders on an iPhone, and when notifications are blocked", async () => {
    vi.mocked(reminderService.getReminderSupport).mockResolvedValueOnce("needs-install");
    const { unmount } = render(
      <ToastProvider>
        <ReminderDialog onClose={() => {}} />
      </ToastProvider>,
    );
    expect(await screen.findByText(/Add to Home Screen/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Turn on" })).not.toBeInTheDocument();
    unmount();

    vi.stubGlobal("Notification", { permission: "denied" });
    renderDialog();
    expect(await screen.findByText(/Notifications are blocked for this site/)).toBeInTheDocument();
  });

  it("should show which time zone applies when another device saved a different one", async () => {
    // Any zone that differs from the machine's own.
    const otherZone = settings.timeZone === "Pacific/Auckland" ? "America/New_York" : "Pacific/Auckland";
    vi.mocked(reminderService.getReminderSettings).mockResolvedValue({
      ...settings,
      timeZone: otherZone,
    });
    vi.mocked(reminderService.isOnForThisDevice).mockReturnValue(true);
    renderDialog();

    expect(await screen.findByText(`Reminders now follow ${otherZone}`, { exact: false })).toBeInTheDocument();
    // Same hour, but saving moves the reminders to this device's time zone.
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(reminderService.updateReminderHours).toHaveBeenCalledWith([21]);
  });

  it("should explain when the settings can't load or the browser has no notifications", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => error.mockRestore());
    vi.mocked(reminderService.getReminderSettings).mockRejectedValueOnce(new Error("offline"));
    const { unmount } = render(
      <ToastProvider>
        <ReminderDialog onClose={() => {}} />
      </ToastProvider>,
    );
    expect(await screen.findByText(/Couldn't load your reminder settings/)).toBeInTheDocument();
    unmount();

    vi.mocked(reminderService.getReminderSupport).mockResolvedValueOnce("unsupported");
    const { onClose } = renderDialog();
    expect(await screen.findByText(/can't show notifications/)).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("should say so when the user blocks notifications at the prompt", async () => {
    vi.mocked(reminderService.turnOnReminders).mockRejectedValue(
      new reminderService.NotificationsBlockedError(),
    );
    const { onClose } = renderDialog();

    await userEvent.click(await screen.findByRole("button", { name: "Turn on" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Notifications are blocked.");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Turn on" })).toBeEnabled();
  });

  it("should speak Swedish, with Swedish times", async () => {
    setLanguageSetting("sv");
    onTestFinished(() => setLanguageSetting("auto"));
    vi.mocked(reminderService.turnOnReminders).mockResolvedValue(undefined);
    renderDialog();

    expect(screen.getByRole("dialog", { name: "Dagliga påminnelser" })).toBeInTheDocument();
    const time = await screen.findByRole("combobox", { name: "Påminnelse 1" });
    expect(screen.getByRole("option", { name: "07:00" })).toBeInTheDocument();
    await userEvent.selectOptions(time, "7");
    await userEvent.click(screen.getByRole("button", { name: "Slå på" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Påminnelser är på. Du får en kl. 07:00");
  });
});
