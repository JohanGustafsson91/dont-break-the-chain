import { defineMessages } from "../../i18n/i18n";

export const verifyEmailMessages = defineMessages({
  en: {
    title: "Check your inbox",
    body: (email: string) =>
      `I sent a link to ${email}. Open it to verify your address, and this page moves on by itself. Can't find it? Look in your spam folder.`,
    verified: "I've verified it",
    notYet: "Not verified yet. Open the link in the email, then try again.",
    resend: "Send the email again",
    resent: "Sent. Check your inbox.",
    resendFailed: "Couldn't send the email. Wait a moment and try again.",
    signOut: "Sign out",
  },
  sv: {
    title: "Kolla din inkorg",
    body: (email: string) =>
      `Jag har skickat en länk till ${email}. Öppna den för att verifiera adressen, så går den här sidan vidare av sig själv. Hittar du den inte? Titta i skräpposten.`,
    verified: "Jag har verifierat",
    notYet: "Inte verifierad än. Öppna länken i mejlet och försök igen.",
    resend: "Skicka mejlet igen",
    resent: "Skickat. Kolla din inkorg.",
    resendFailed: "Det gick inte att skicka mejlet. Vänta en stund och försök igen.",
    signOut: "Logga ut",
  },
});
