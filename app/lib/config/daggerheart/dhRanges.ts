import DhRange from "@/app/lib/definitions/enums/daggerheart/DhRange";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** The five ranges (SPEC-028 T1), as select options. */
const dhRanges: SelectOption<DhRange>[] = [
  { value: DhRange.Melee, labelKey: "daggerheart.ranges.melee" },
  { value: DhRange.VeryClose, labelKey: "daggerheart.ranges.veryClose" },
  { value: DhRange.Close, labelKey: "daggerheart.ranges.close" },
  { value: DhRange.Far, labelKey: "daggerheart.ranges.far" },
  { value: DhRange.VeryFar, labelKey: "daggerheart.ranges.veryFar" },
];

export default dhRanges;
