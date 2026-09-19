/**
 * The `include` a list or card query adds to carry each row's image keys
 * (SPEC-020 T4) — one join in the query that already reads the rows, rather
 * than one lookup per row. Paired with `recordImageKeysSchema`, which is
 * what lets the keys survive `buildResultSchema`'s parse.
 */
const recordImageKeysInclude = {
  image: {
    select: { displayKey: true, thumbKey: true, width: true, height: true },
  },
} as const;

export default recordImageKeysInclude;
