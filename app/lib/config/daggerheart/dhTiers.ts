import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** The first and last tier (`daggerheart.md` §8). */
export const DH_TIER_MIN = 1;
export const DH_TIER_MAX = 4;

/**
 * Tiers 1–4 as select options (SPEC-028 T1), so the form offers only legal
 * tiers and a list header can filter by one. The `tier` columns' CHECKs are
 * the same range.
 */
const dhTiers: SelectOption<number>[] = Array.from(
  { length: DH_TIER_MAX - DH_TIER_MIN + 1 },
  (_, index) => {
    const tier = DH_TIER_MIN + index;
    return { value: tier, labelKey: `daggerheart.tiers.tier${tier}` };
  }
);

export default dhTiers;
