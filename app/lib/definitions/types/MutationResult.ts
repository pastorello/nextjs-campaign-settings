/**
 * What a `create*` / `update*` Server Action returns. Success carries nothing;
 * failure carries Zod's field-keyed error map so a form can show errors inline.
 */
type MutationResult =
  { ok: true } | { ok: false; errors: Record<string, string[] | undefined> };

export default MutationResult;
