import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** The first and last level a domain card can have (SPEC-021 §5). */
export const DH_CARD_LEVEL_MIN = 1;
export const DH_CARD_LEVEL_MAX = 10;

/**
 * A domain card's levels, 1–10, as select options — so the form offers only
 * legal levels and the list header can filter by one. The `level` column's
 * CHECK constraint is the same range.
 */
const dhDomainCardLevels: SelectOption<number>[] = Array.from(
  { length: DH_CARD_LEVEL_MAX - DH_CARD_LEVEL_MIN + 1 },
  (_, index) => {
    const level = DH_CARD_LEVEL_MIN + index;
    return { value: level, labelKey: `dhDomainCards.levels.level${level}` };
  }
);

export default dhDomainCardLevels;
