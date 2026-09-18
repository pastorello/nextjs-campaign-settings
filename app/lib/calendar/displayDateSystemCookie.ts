/**
 * The per-viewer "show dates in" preference (SPEC-014 §5.2): a cookie
 * holding a date system's id. A cookie rather than `localStorage` because
 * dates are rendered by Server Components, which can read a cookie on the
 * request and render in the chosen system the first time — `localStorage`
 * would force every date to render client-side, first in the default and
 * then, after hydration, in the preference. It is per browser, never per
 * campaign, and never stored in the database.
 */
export const DISPLAY_DATE_SYSTEM_COOKIE = "worldDateSystem";

/** A year: long enough to feel permanent, short enough to expire unused. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** The cookie's value as a system id, or `null` when absent or malformed. */
export function parseDisplayDateSystemId(
  value: string | undefined
): number | null {
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** The `document.cookie` assignment that stores `systemId`. */
export function serializeDisplayDateSystemCookie(systemId: number): string {
  return `${DISPLAY_DATE_SYSTEM_COOKIE}=${systemId}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}
