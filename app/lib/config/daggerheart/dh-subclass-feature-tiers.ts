import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/**
 * A subclass's three feature groups, in the order they are shown and
 * edited: foundation, specialization, mastery (SPEC-021 §5.5).
 */
const dhSubclassFeatureTiers: SelectOption<DhSubclassFeatureTier>[] =
  Object.values(DhSubclassFeatureTier).map((tier) => ({
    value: tier,
    labelKey: `dhSubclasses.tiers.${tier}`,
  }));

export default dhSubclassFeatureTiers;
