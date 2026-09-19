import AppError from "./AppError";
import type FieldErrorMessage from "../definitions/types/FieldErrorMessage";

/**
 * The request is well-formed and the record exists, but completing it would
 * violate a relationship the caller cannot see from the request alone — e.g.
 * deleting a `faction` twelve `npc` rows still reference (SPEC-006 §5's
 * refusal, which names them rather than surfacing the FK's raw error).
 *
 * `refusal` is the same refusal as a catalogue key (TD-124), for a caller
 * that shows it translated: `toErrorResponse` sends it, and `DeleteButton`
 * resolves it at the render boundary (ADR-0007). `message` stays for the log
 * and for callers that predate it.
 */
export default class ConflictError extends AppError {
  readonly httpStatus = 409;
  readonly refusal: FieldErrorMessage | undefined;

  constructor(message: string, refusal?: FieldErrorMessage) {
    super(message);
    this.refusal = refusal;
  }
}
