import { defineMessages } from "../../i18n/i18n";

export const legalMessages = defineMessages({
  en: {
    back: "‹ Back to the app",
    effective: (date: string) => `Effective ${date}`,
    questions: "Questions? Email",
    privacyTitle: "Privacy policy",
    termsTitle: "Terms of use",
  },
  sv: {
    back: "‹ Tillbaka till appen",
    effective: (date: string) => `Gäller från ${date}`,
    questions: "Frågor? Mejla",
    privacyTitle: "Integritetspolicy",
    termsTitle: "Användarvillkor",
  },
});
