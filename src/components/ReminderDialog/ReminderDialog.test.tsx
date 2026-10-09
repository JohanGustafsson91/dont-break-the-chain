import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, onTestFinished } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as reminderService from "../../services/reminderService";
import { ReminderDialog } from "./ReminderDialog";
import { ToastProvider } from "../Toast/Toast.Provider";

vi.mock("../../services/reminderService", async (importOriginal) => ({
  ...(await importOriginal<typeof reminderService>()),
  getReminderSupport: vi.fn(),
  getReminderSettings: vi.fn(),
  isOnForThisDevice: vi.fn(),
  turnOnReminders: vi.fn(),
  updateReminderHour: vi.fn(),
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
    expect(screen.getByRole("dialog", { name: "Daily reminder" })).toHaveFocus();

    const time = await screen.findByLabelText("Remind me at");
    expect(time).toHaveValue("20"); // the default
    await userEvent.selectOptions(time, "7");
    await userEvent.click(screen.getByRole("button", { name: "Turn on" }));

    expect(reminderService.turnOnReminders).toHaveBeenCalledWith(7);
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

    const time = await screen.findByLabelText("Remind me at");
    expect(time).toHaveValue("21");
    // There must always be a way out, also on a phone without an Escape key.
    expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled(); // nothing changed yet
    await userEvent.selectOptions(time, "8");
    await userEvent.click(save);
    expect(reminderService.updateReminderHour).toHaveBeenCalledWith(8);
    unmount();

    const { onClose } = renderDialog();
    await userEvent.click(await screen.findByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
    expect(reminderService.turnOffRemindersOnThisDevice).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Turn off reminders on this device" }));
    expect(reminderService.turnOffRemindersOnThisDevice).toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent("Reminders are off on this device.");
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
    expect(reminderService.updateReminderHour).toHaveBeenCalledWith(21);
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
});
