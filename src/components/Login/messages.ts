import { defineMessages } from "../../i18n/i18n";

// Sentences with links are split around the link texts, so each language can place them.
export const loginMessages = defineMessages({
  en: {
    accountDeleted: "Your account and all your data have been deleted.",
    tagline: "Build habits that stick, one day at a time.",
    pitch: "Check off each day, watch your chain grow, and get a nudge when something is still left.",
    videoLabel: "A 30-second look at the app",
    featuresTitle: "Why it works",
    features: [
      { title: "Reminders that know", text: "Up to three a day, only when something is still left to do." },
      { title: "Everything at a glance", text: "Every habit side by side, two or four weeks at a time." },
      { title: "Motivation that's yours", text: "New records, milestones and comebacks, from your own history." },
      { title: "Free, no ads", text: "Your data stays yours. Export or delete it any time." },
    ],
    termsLink: "terms of use",
    privacyLink: "privacy policy",
    acceptedBefore: "You accepted the ",
    acceptedMiddle: " on this device. See also the ",
    acceptedAfter: ".",
    consentBefore: "I accept the ",
    consentMiddle: " and have read the ",
    consentAfter: ".",
    continueWith: (provider: string) => `Continue with ${provider}`,
  },
  sv: {
    accountDeleted: "Ditt konto och all din data har raderats.",
    tagline: "Bygg vanor som håller, en dag i taget.",
    pitch: "Bocka av varje dag, se kedjan växa och få en knuff när något är kvar.",
    videoLabel: "En 30 sekunder lång titt på appen",
    featuresTitle: "Därför fungerar det",
    features: [
      { title: "Påminnelser som vet", text: "Upp till tre om dagen, bara när något är kvar att göra." },
      { title: "Allt på ett ögonblick", text: "Alla vanor sida vid sida, två eller fyra veckor i taget." },
      { title: "Motivation på riktigt", text: "Nya rekord, milstolpar och comebacks, utifrån din egen historik." },
      { title: "Gratis, ingen reklam", text: "Din data är din. Exportera eller radera den när du vill." },
    ],
    termsLink: "användarvillkoren",
    privacyLink: "integritetspolicyn",
    acceptedBefore: "Du har godkänt ",
    acceptedMiddle: " på den här enheten. Läs även ",
    acceptedAfter: ".",
    consentBefore: "Jag godkänner ",
    consentMiddle: " och har läst ",
    consentAfter: ".",
    continueWith: (provider: string) => `Fortsätt med ${provider}`,
  },
});
