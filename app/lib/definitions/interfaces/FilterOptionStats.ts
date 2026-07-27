/**
 * How many records sit behind each option of a filter — the counts a filter
 * button would show as "Mago (42)".
 *
 * **Unwired scaffolding.** `SelectButtonery` renders these when given them, and
 * nothing has ever given them: `itemStats` is optional and no caller passes it.
 * Kept rather than deleted, per the project's "unused is not dead" rule, but
 * typed rather than left as a `ListItem` of `any` (TD-08 step 4) — so whoever
 * wires it up has the shape the component already expects instead of having to
 * reverse-engineer it from index expressions.
 */
export default interface FilterOptionStats {
  total: number;

  /** Count per option value, ignoring the filter currently applied. */
  partial: Record<string | number, number>;

  /** Count per option value, with the current filter applied. */
  filtered: Record<string | number, number>;
}
