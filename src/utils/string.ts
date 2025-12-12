export const pluralize = (
  count: number,
  singular: string,
  plural: string = `${singular}s`
) => count === 1 ? singular : plural;
