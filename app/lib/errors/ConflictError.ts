import AppError from "./AppError";

/**
 * The request is well-formed and the record exists, but completing it would
 * violate a relationship the caller cannot see from the request alone — e.g.
 * deleting a `faction` twelve `npc` rows still reference (SPEC-006 §5's
 * refusal, which names them rather than surfacing the FK's raw error).
 */
export default class ConflictError extends AppError {
  readonly httpStatus = 409;

  constructor(message: string) {
    super(message);
  }
}
