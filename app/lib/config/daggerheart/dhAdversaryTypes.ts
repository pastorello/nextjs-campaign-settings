import DhAdversaryType from "@/app/lib/definitions/enums/daggerheart/DhAdversaryType";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** An adversary's types (SPEC-028 T1), as select options. */
const dhAdversaryTypes: SelectOption<DhAdversaryType>[] = [
  {
    value: DhAdversaryType.Bruiser,
    labelKey: "daggerheart.adversaryTypes.bruiser",
  },
  {
    value: DhAdversaryType.Horde,
    labelKey: "daggerheart.adversaryTypes.horde",
  },
  {
    value: DhAdversaryType.Leader,
    labelKey: "daggerheart.adversaryTypes.leader",
  },
  {
    value: DhAdversaryType.Minion,
    labelKey: "daggerheart.adversaryTypes.minion",
  },
  {
    value: DhAdversaryType.Ranged,
    labelKey: "daggerheart.adversaryTypes.ranged",
  },
  {
    value: DhAdversaryType.Skulk,
    labelKey: "daggerheart.adversaryTypes.skulk",
  },
  {
    value: DhAdversaryType.Social,
    labelKey: "daggerheart.adversaryTypes.social",
  },
  { value: DhAdversaryType.Solo, labelKey: "daggerheart.adversaryTypes.solo" },
  {
    value: DhAdversaryType.Standard,
    labelKey: "daggerheart.adversaryTypes.standard",
  },
  {
    value: DhAdversaryType.Support,
    labelKey: "daggerheart.adversaryTypes.support",
  },
];

export default dhAdversaryTypes;
