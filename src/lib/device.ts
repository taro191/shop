/** True for phone-class user agents (Android/iPhone/etc). Deliberately excludes
 * iPad — modern iPadOS Safari's UA has no "Mobile" token and behaves fine with
 * the desktop-oriented layout, so it falls through to the normal experience. */
export function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /Android|iPhone|iPod|IEMobile|BlackBerry|Opera Mini|Mobile/i.test(userAgent);
}
