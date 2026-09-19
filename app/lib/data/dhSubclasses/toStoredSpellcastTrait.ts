import { NO_SPELLCAST_TRAIT } from "@/app/lib/config/daggerheart/dh-spellcast-traits";

/**
 * The validated form value as the column stores it: "none" is `null`, a
 * subclass that does not cast (SPEC-021 §6). The read direction needs no
 * helper — the result schema falls back to the field's `defaultValue`,
 * which is "none".
 */
export default function toStoredSpellcastTrait(value: string): string | null;
export default function toStoredSpellcastTrait(
  value: string | undefined
): string | null | undefined;
export default function toStoredSpellcastTrait(
  value: string | undefined
): string | null | undefined {
  return value === NO_SPELLCAST_TRAIT ? null : value;
}
