import AppError from "./AppError";

/**
 * A query failed: the database is unreachable, a constraint was violated, the
 * schema has drifted.
 *
 * Always constructed with the original error as `cause`. That is the whole
 * point of the class — the message says which operation failed, the cause says
 * why, and `ECONNREFUSED` reaches the reader instead of dying in a
 * `console.error`.
 */
export default class DatabaseError extends AppError {
  readonly httpStatus = 500;

  constructor(operation: string, cause: unknown) {
    super(`Database error while ${operation}`, { cause });
  }
}
