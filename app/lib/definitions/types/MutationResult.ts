import type MutationRefusalCode from "./MutationRefusalCode";

/**
 * What a `create*` / `update*` Server Action returns. Success carries nothing;
 * failure carries Zod's field-keyed error map so a form can show errors inline,
 * and — when the mutation refused a well-formed request rather than failing to
 * validate it — a `code` naming the rule that refused (TD-93).
 */
type MutationResult =
  | { ok: true }
  | {
      ok: false;
      errors: Record<string, string[] | undefined>;
      code?: MutationRefusalCode;
    };

export default MutationResult;
