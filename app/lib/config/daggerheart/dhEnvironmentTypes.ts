import DhEnvironmentType from "@/app/lib/definitions/enums/daggerheart/DhEnvironmentType";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** An environment's types (SPEC-028 T1), as select options. */
const dhEnvironmentTypes: SelectOption<DhEnvironmentType>[] = [
  {
    value: DhEnvironmentType.Exploration,
    labelKey: "daggerheart.environmentTypes.exploration",
  },
  {
    value: DhEnvironmentType.Social,
    labelKey: "daggerheart.environmentTypes.social",
  },
  {
    value: DhEnvironmentType.Traversal,
    labelKey: "daggerheart.environmentTypes.traversal",
  },
  {
    value: DhEnvironmentType.Event,
    labelKey: "daggerheart.environmentTypes.event",
  },
];

export default dhEnvironmentTypes;
