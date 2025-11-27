export const pluralize = (count: number, singular: string) =>
  count === 1 ? singular : `${singular}s`;
