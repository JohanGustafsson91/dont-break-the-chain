import { defineMessages } from "../../i18n/i18n";

export const accountMenuMessages = defineMessages({
  en: {
    menu: "Account menu",
    reminder: "Daily reminders",
    exportData: "Export my data",
    deleteAccount: "Delete my account",
    privacy: "Privacy policy",
    terms: "Terms of use",
    logOut: "Log out",
    language: "Language",
    automatic: (current: string) => `Automatic (${current})`,
    exported: "Your data has been downloaded.",
    exportFailed: "Couldn't export your data. Please try again.",
    confirmIdentity: "Confirm it's you in the sign-in window to delete your account…",
    deleteTitle: "Delete your account?",
    deleteBody:
      "All your habits, days and notes are deleted for good, and your account is removed. Export your data first if you want a copy. You'll be asked to sign in again to confirm. Access you gave the app in your Google or GitHub account can be removed there.",
    deleteConfirm: "Delete everything",
    back: "‹ Habits",
    backToOverview: "‹ Overview",
  },
  sv: {
    menu: "Kontomeny",
    reminder: "Dagliga påminnelser",
    exportData: "Exportera min data",
    deleteAccount: "Radera mitt konto",
    privacy: "Integritetspolicy",
    terms: "Användarvillkor",
    logOut: "Logga ut",
    language: "Språk",
    automatic: (current: string) => `Automatiskt (${current.toLowerCase()})`,
    exported: "Din data har laddats ner.",
    exportFailed: "Det gick inte att exportera din data. Försök igen.",
    confirmIdentity: "Bekräfta att det är du i inloggningsfönstret för att radera kontot…",
    deleteTitle: "Radera ditt konto?",
    deleteBody:
      "Alla dina vanor, dagar och anteckningar raderas för gott, och ditt konto tas bort. Exportera din data först om du vill ha en kopia. Du får logga in igen för att bekräfta. Åtkomst du gett appen i ditt Google- eller GitHub-konto kan tas bort där.",
    deleteConfirm: "Radera allt",
    back: "‹ Vanor",
    backToOverview: "‹ Översikt",
  },
});

/** Each language by its own name, so it can be found whatever the app is set to. */
export const languageNames = { en: "English", sv: "Svenska" } as const;
