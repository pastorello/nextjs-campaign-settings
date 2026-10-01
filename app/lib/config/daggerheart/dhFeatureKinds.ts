import DhFeatureKind from "@/app/lib/definitions/enums/daggerheart/DhFeatureKind";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** A stat block feature's kinds (SPEC-028 T1), as select options. */
const dhFeatureKinds: SelectOption<DhFeatureKind>[] = [
  { value: DhFeatureKind.Action, labelKey: "daggerheart.featureKinds.action" },
  {
    value: DhFeatureKind.Reaction,
    labelKey: "daggerheart.featureKinds.reaction",
  },
  {
    value: DhFeatureKind.Passive,
    labelKey: "daggerheart.featureKinds.passive",
  },
];

export default dhFeatureKinds;
