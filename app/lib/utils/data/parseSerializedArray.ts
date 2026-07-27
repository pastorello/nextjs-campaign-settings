import isValidDataArray from "../validators/isValidDataArray";
import isValidString from "../validators/isValidString";

/**
 * Reads a serialized array of ids into numbers, discarding duplicates.
 *
 * Entries arrive as numbers or as numeric strings — `'[1,"0"]'` — which is why
 * each one goes through `parseInt` rather than being trusted.
 *
 * The reduce prepends, so the result comes back in reverse order of appearance.
 * That is long-standing behaviour its test pins (`'[1,"0"]'` → `[0, 1]`), kept
 * as it was: this change removes an `any` (TD-08), and the ordering is somebody
 * else's decision to revisit.
 */
const parseSerializedArray = (serializedArray: string): number[] => {
  if (!isValidString(serializedArray)) return [];

  // `isValidDataArray` narrows to `unknown[]` now rather than `any[]`, so each
  // entry has to be converted rather than assumed to be a number already —
  // which is the whole point of dropping the `any`.
  const parsed: unknown = JSON.parse(serializedArray);

  if (!isValidDataArray(parsed)) return [];

  return parsed.reduce<number[]>((acc, item) => {
    const value = parseInt(String(item), 10);

    if (Number.isNaN(value) || acc.includes(value)) return acc;

    return [value, ...acc];
  }, []);
};

export default parseSerializedArray;
