import { defineMessages } from "../i18n/i18n";

export const habitMessages = defineMessages({
  en: { defaultName: "New habit" },
  sv: { defaultName: "Ny vana" },
});

export const signInMessages = defineMessages({
  en: {
    accountExists: (provider: string) =>
      `An account with this email already exists. Sign in with ${provider} instead.`,
    popupBlocked: "Your browser blocked the sign-in window. Allow pop-ups for this site and try again.",
    networkFailed: "Couldn't reach the sign-in service. Check your connection and try again.",
    failed: "Signing in didn't work. Please try again.",
  },
  sv: {
    accountExists: (provider: string) =>
      `Det finns redan ett konto med den här e-postadressen. Logga in med ${provider} i stället.`,
    popupBlocked:
      "Webbläsaren blockerade inloggningsfönstret. Tillåt popup-fönster för den här sidan och försök igen.",
    networkFailed: "Det gick inte att nå inloggningstjänsten. Kontrollera anslutningen och försök igen.",
    failed: "Inloggningen misslyckades. Försök igen.",
  },
});

export const accountDeletionMessages = defineMessages({
  en: {
    nothingDeleted: "Nothing was deleted.",
    userMismatch: "Choose the same account you're signed in with. Nothing was deleted.",
    notConfirmed: "Couldn't confirm it's you. Nothing was deleted.",
    habitsFailed: "Deleting your habits failed. Please try again.",
    accountFailed: "Your habits were deleted, but your account couldn't be removed. Please try again.",
  },
  sv: {
    nothingDeleted: "Inget raderades.",
    userMismatch: "Välj samma konto som du är inloggad med. Inget raderades.",
    notConfirmed: "Det gick inte att bekräfta att det är du. Inget raderades.",
    habitsFailed: "Det gick inte att radera dina vanor. Försök igen.",
    accountFailed: "Dina vanor raderades, men kontot kunde inte tas bort. Försök igen.",
  },
});
