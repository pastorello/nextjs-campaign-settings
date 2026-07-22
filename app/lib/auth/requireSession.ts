import { auth } from "@/auth";

/**
 * Thrown by {@link requireSession} when a mutation is reached without a
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
 * Guard for `"use server"` mutations. Server Actions are POST endpoints any
 * client can reach, and the proxy does not cover them, so every write must
 * verify a session itself. Throws {@link UnauthorizedError} when none exists;
 * returns the session otherwise.
 */
export default async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}
