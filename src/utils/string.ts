export const pluralize = (
  count: number,
  singular: string,
  plural: string = `${singular}s`
) => count === 1 ? singular : plural;

export const formatGoodShare = (goodDays: number, badDays: number) => {
  const total = goodDays + badDays;
  return total === 0
    ? "No days yet"
    : `Good ${Math.round((goodDays / total) * 100)} %`;
};

export const formatWeekProgress = (goodDaysThisWeek: number, times: number) =>
  `${goodDaysThisWeek}/${times} this week`;
