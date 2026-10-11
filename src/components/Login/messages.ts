import { defineMessages } from "../../i18n/i18n";

// Sentences with links are split around the link texts, so each language can place them.
export const loginMessages = defineMessages({
  en: {
    accountDeleted: "Your account and all your data have been deleted.",
    tagline: "Build habits, stay consistent, and keep your streak alive!",
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
    tagline: "Bygg vanor, håll i och bryt inte kedjan!",
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
