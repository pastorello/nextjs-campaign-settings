import DeityRank from "../../definitions/enums/deities/DeityRank";
import SelectOption from "../../definitions/types/SelectOption";

const deityLevels: SelectOption<number>[] = [
  {
    value: DeityRank.DemoneOmbra,
    label: "Demone Ombra",
  },
  {
    value: DeityRank.DioMinore,
    label: "Dio Minore",
  },
  {
    value: DeityRank.DioSupremo,
    label: "Dio Supremo",
  },
  {
    value: DeityRank.Divinità,
    label: "Divinità",
  },
];

export default deityLevels;
