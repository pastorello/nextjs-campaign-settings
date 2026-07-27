import DatabaseError from "./DatabaseError";
import DatabaseUnreachableError from "./DatabaseUnreachableError";
import isConnectionFailure from "./isConnectionFailure";

/**
 * Wraps a failed query in the right error class (TD-25).
 *
 * Call sites say what they were doing; this decides whether the database
 * refused the *query* or refused the *connection*. Keeping the decision here
 * means the five fetch functions do not each have to know what ECONNREFUSED
 * looks like, and a new call site gets the distinction for free.
 */
export default function toDatabaseError(
  operation: string,
  cause: unknown
): DatabaseError | DatabaseUnreachableError {
  return isConnectionFailure(cause)
    ? new DatabaseUnreachableError(operation, cause)
    : new DatabaseError(operation, cause);
}
