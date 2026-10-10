/**
 * Where to send a visitor who reached the app on another host, such as the old
 * Firebase address (…web.app), or undefined to stay. Only production builds set a
 * canonical host, so dev, localhost and the end-to-end tests never redirect.
 */
export const canonicalRedirect = (
  location: Pick<Location, "hostname" | "pathname" | "search" | "hash">,
  canonicalHost: string | undefined,
): string | undefined => {
  if (!canonicalHost || location.hostname === canonicalHost) return undefined;
  return `https://${canonicalHost}${location.pathname}${location.search}${location.hash}`;
};
