/**
 * Whether an error means "nothing is listening", as opposed to a query that
 * reached the database and failed there.
 *
 * The distinction matters because the remedies are unrelated: one is "start
 * Postgres", the other is "look at the query". The driver reports it through a
 * `code` on the error, or — once Prisma has wrapped it a layer or two — only in
 * the message, so both are checked.
 */
const CONNECTION_CODES = [
  "ECONNREFUSED", // nothing listening on the port
  "ENOTFOUND", // host does not resolve
  "EHOSTUNREACH",
  "ETIMEDOUT",
  "ECONNRESET", // server went away mid-connection
];

export default function isConnectionFailure(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && CONNECTION_CODES.includes(code)) return true;

  const message = (error as { message?: unknown }).message;
  if (
    typeof message === "string" &&
    CONNECTION_CODES.some((candidate) => message.includes(candidate))
  ) {
    return true;
  }

  // Prisma wraps the driver error; the original travels as `cause`.
  const cause = (error as { cause?: unknown }).cause;

  return cause === undefined || cause === error
    ? false
    : isConnectionFailure(cause);
}
