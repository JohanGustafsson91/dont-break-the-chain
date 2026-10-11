import { defineMessages } from "../i18n/i18n";

export const stringMessages = defineMessages({
  en: {
    noDaysYet: "No days yet",
    goodShare: (percent: number) => `Good ${percent} %`,
    weekProgress: (done: number, times: number) => `${done}/${times} this week`,
  },
  sv: {
    noDaysYet: "Inga dagar än",
    goodShare: (percent: number) => `${percent} % bra`,
    weekProgress: (done: number, times: number) => `${done}/${times} i veckan`,
  },
});
