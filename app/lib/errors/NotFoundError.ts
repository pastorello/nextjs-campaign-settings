import AppError from "./AppError";

/**
 * A record the caller named does not exist.
 *
 * Distinct from `DatabaseError` on purpose: the four `delete*ById` functions
 * used to return a bare `boolean`, so "no such row" and "the database is
 * unreachable" were the same value, and every route handler mapped both to
 * HTTP 500. A missing record is a 404 — the request was well formed, the thing
 * simply is not there.
 */
export default class NotFoundError extends AppError {
  readonly httpStatus = 404;

  constructor(resource: string, id: number | string) {
    super(`${resource} ${id} not found`);
  }
}
