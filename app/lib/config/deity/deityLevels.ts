import GradoPatrono from "../../definitions/enums/deities/GradoPatrono";
import SelectOption from "../../definitions/types/SelectOption";

const deityLevels: SelectOption[] = [
  {
    value: GradoPatrono.DemoneOmbra,
    label: "Demone Ombra",
  },
  {
    value: GradoPatrono.DioMinore,
    label: "Dio Minore",
  },
  {
    value: GradoPatrono.DioSupremo,
    label: "Dio Supremo",
  },
  {
    value: GradoPatrono.Divinità,
    label: "Divinità",
  },
];

export default deityLevels;
