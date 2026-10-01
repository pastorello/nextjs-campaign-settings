/**
 * The `include` that reads a record's reveals (SPEC-022 T6): only the
 * campaigns' ids, which `withRevealedIds` flattens for the result schema.
 */
const revealedToInclude = {
  revealedTo: { select: { id: true } },
} as const;

export default revealedToInclude;
