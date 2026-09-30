import { auth } from "@/auth";

/**
 * Thrown by {@link requireDm} when a mutation is reached without a
 * session. A distinct type so callers and tests can tell "not logged in" apart
 * from a database or validation failure.
 */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Thrown by {@link requireDm} when the session belongs to a player (SPEC-022).
 * Distinct from {@link UnauthorizedError}: the request is authenticated, it is
 * just not the DM's.
 */
export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Guard for `"use server"` mutations. Server Actions are POST endpoints any
 * client can reach, and the proxy does not cover them, so every write must
 * verify the caller itself. Every mutation in the app is the DM's (SPEC-022):
 * throws {@link UnauthorizedError} without a session and
 * {@link ForbiddenError} for a player; returns the session otherwise.
 *
 * The role is fresh: `auth()` runs `auth.ts`'s jwt callback, which re-reads
 * the account's row, so a disabled or demoted account fails here at its next
 * request rather than when its token expires.
 */
export default async function requireDm() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  if (session.user.role !== "dm") {
    throw new ForbiddenError();
  }
  return session;
}
