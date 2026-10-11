import { defineMessages } from "../../i18n/i18n";

export const reminderDialogMessages = defineMessages({
  en: {
    title: "Daily reminder",
    loading: "Loading",
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    turnOn: "Turn on",
    turnOffHere: "Turn off reminders on this device",
    intro: "Get a notification when some of your habits aren't marked yet that day.",
    remindMeAt: "Remind me at",
    timeZoneChanged: (saved: string, device: string) =>
      `Reminders now follow ${saved}. Saving switches them to this device's time zone (${device}).`,
    timeZoneNote: (device: string) => `The time applies to all your devices, in your time zone (${device}).`,
    loadFailed: "Couldn't load your reminder settings. Check your connection and try again.",
    needsInstall:
      "On iPhone and iPad, reminders only work in the installed app. Tap Share, then Add to Home Screen, and open the app from there.",
    unsupported: "This browser can't show notifications from websites.",
    blocked:
      "Notifications are blocked for this site. Allow them in your browser or system settings to get reminders.",
    blockedToast: "Notifications are blocked. Allow them for this site in your settings.",
    tryAgain: (failure: string) => `${failure} Please try again.`,
    turnedOn: (time: string) =>
      `Reminders are on. You'll get one at ${time} when some of your habits aren't marked yet.`,
    turnOnFailed: "Couldn't turn on reminders.",
    saved: (time: string) => `Reminder time saved: ${time}.`,
    saveFailed: "Couldn't save the reminder time.",
    turnedOff: "Reminders are off on this device.",
    turnOffFailed: "Couldn't turn off reminders.",
  },
  sv: {
    title: "Daglig påminnelse",
    loading: "Laddar",
    close: "Stäng",
    cancel: "Avbryt",
    save: "Spara",
    turnOn: "Slå på",
    turnOffHere: "Stäng av påminnelser på den här enheten",
    intro: "Få en notis de dagar du har vanor som inte är markerade än.",
    remindMeAt: "Påminn mig kl.",
    timeZoneChanged: (saved: string, device: string) =>
      `Påminnelserna följer just nu ${saved}. Om du sparar används den här enhetens tidszon (${device}) i stället.`,
    timeZoneNote: (device: string) => `Tiden gäller alla dina enheter, i din tidszon (${device}).`,
    loadFailed: "Det gick inte att ladda dina påminnelseinställningar. Kontrollera anslutningen och försök igen.",
    needsInstall:
      "På iPhone och iPad fungerar påminnelser bara i den installerade appen. Tryck på Dela, sedan Lägg till på hemskärmen, och öppna appen därifrån.",
    unsupported: "Den här webbläsaren kan inte visa notiser från webbplatser.",
    blocked:
      "Notiser är blockerade för den här webbplatsen. Tillåt dem i webbläsarens eller systemets inställningar för att få påminnelser.",
    blockedToast: "Notiser är blockerade. Tillåt dem för den här webbplatsen i dina inställningar.",
    tryAgain: (failure: string) => `${failure} Försök igen.`,
    turnedOn: (time: string) =>
      `Påminnelser är på. Du får en kl. ${time} om du har vanor som inte är markerade än.`,
    turnOnFailed: "Det gick inte att slå på påminnelser.",
    saved: (time: string) => `Påminnelsetiden har sparats: ${time}.`,
    saveFailed: "Det gick inte att spara påminnelsetiden.",
    turnedOff: "Påminnelser är avstängda på den här enheten.",
    turnOffFailed: "Det gick inte att stänga av påminnelser.",
  },
});
