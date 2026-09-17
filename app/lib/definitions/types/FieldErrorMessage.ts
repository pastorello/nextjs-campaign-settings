import type FieldErrorKey from "./FieldErrorKey";

/**
 * One refusal of one field, as the server returns it (TD-124): a catalogue
 * key plus the ICU parameters its message interpolates. It becomes text only
 * at the render boundary, in `resolveFieldErrors` (ADR-0007).
 */
interface FieldErrorMessage {
  key: FieldErrorKey;
  values?: Record<string, string | number>;
}

export default FieldErrorMessage;
