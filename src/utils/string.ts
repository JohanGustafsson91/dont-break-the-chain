import { messagesFor } from "../i18n/i18n";
import { stringMessages } from "./messages";

/** Pass the plural for anything but an English "-s" plural, e.g. pluralize(n, "dag", "dagar"). */
export const pluralize = (
  count: number,
  singular: string,
  plural: string = `${singular}s`
) => count === 1 ? singular : plural;

export const formatGoodShare = (goodDays: number, badDays: number) => {
  const total = goodDays + badDays;
  const t = messagesFor(stringMessages);
  return total === 0
    ? t.noDaysYet
    : t.goodShare(Math.round((goodDays / total) * 100));
};

export const formatWeekProgress = (goodDaysThisWeek: number, times: number) =>
  messagesFor(stringMessages).weekProgress(goodDaysThisWeek, times);
