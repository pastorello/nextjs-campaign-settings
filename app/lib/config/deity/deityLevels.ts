import DeityRank from "../../definitions/enums/deities/DeityRank";
import SelectOption from "../../definitions/types/SelectOption";

const deityLevels: SelectOption<number>[] = [
  {
    value: DeityRank.DemoneOmbra,
    labelKey: "deities.ranks.demoneOmbra",
  },
  {
    value: DeityRank.DioMinore,
    labelKey: "deities.ranks.dioMinore",
  },
  {
    value: DeityRank.DioSupremo,
    labelKey: "deities.ranks.dioSupremo",
  },
  {
    value: DeityRank.Divinità,
    labelKey: "deities.ranks.divinita",
  },
];

export default deityLevels;
