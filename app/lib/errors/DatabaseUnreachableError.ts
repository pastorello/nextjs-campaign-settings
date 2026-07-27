import AppError from "./AppError";

/**
 * The database did not answer at all (TD-25).
 *
 * Separate from `DatabaseError` because the two mean different things to
 * whoever is reading: a failed query is a bug in the query, an unreachable
 * database is a process that is not running. TD-13 made the cause visible;
 * this makes the *kind* visible, so a message can say "start Postgres" instead
 * of "something went wrong".
 *
 * 503 rather than 500: the service is temporarily unavailable, and the request
 * itself was fine.
 */
export default class DatabaseUnreachableError extends AppError {
  readonly httpStatus = 503;

  /** Stable prefix, so a client error boundary can recognise it by message. */
  static readonly PREFIX = "Database unreachable";

  constructor(operation: string, cause: unknown) {
    super(`${DatabaseUnreachableError.PREFIX} while ${operation}`, { cause });
  }
}
