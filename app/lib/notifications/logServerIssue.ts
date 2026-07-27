/**
 * Records something the person running the server needs to know (TD-10).
 *
 * The other half of the old `sendNotification` split. These call sites are on
 * the server, where there is no user to notify — an invalid login, a metadata
 * key that does not resolve. Calling that a "notification" is what made the
 * original confusing: it logged to a terminal and named itself after a UI
 * affordance it never had.
 *
 * Errors raised by our own code carry their cause since TD-13, so this exists
 * for the cases that are not exceptions: a programming mistake worth surfacing,
 * or a login that failed for an expected reason.
 */
export default function logServerIssue(message: string, cause?: unknown): void {
  if (cause === undefined) {
    console.error(message);
    return;
  }

  console.error(message, cause);
}
