/**
 * Flattens a row's `revealedTo: [{ id }]`, read through `revealedToInclude`,
 * into the id list its field holds (SPEC-022 T6). `key` is the field the
 * page declares: `revealedTo`, or `revealedToDnd5e` for the 5e catalogues.
 * Both read the same relation.
 */
export default function withRevealedIds<
  Row extends { revealedTo?: { id: number }[] },
>(row: Row, key: "revealedTo" | "revealedToDnd5e" = "revealedTo") {
  return { ...row, [key]: (row.revealedTo ?? []).map(({ id }) => id) };
}
