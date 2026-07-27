/**
 * An array the type system knows has at least one element.
 *
 * The option lists behind every select are non-empty by construction, and the
 * metadata layer relies on it: `defaultValue: rarity[0].value` is only sound
 * because `rarity` always has a first entry. Plain `T[]` does not say that, so
 * under `noUncheckedIndexedAccess` (TD-20b) every one of those reads became
 * "possibly undefined" — correctly, given what the type claimed.
 *
 * Declaring the lists as `NonEmptyArray<T>` makes the assumption true rather
 * than asserting it away with `!` at two dozen call sites.
 */
type NonEmptyArray<T> = [T, ...T[]];

export default NonEmptyArray;
