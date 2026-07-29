import DeityType from "../../definitions/enums/deities/DeityType";
import SelectOption from "../../definitions/types/SelectOption";

const deityTypes: SelectOption<number>[] = [
  {
    value: DeityType.Arconte,
    label: "Arconte",
  },
  {
    value: DeityType.Demone,
    label: "Demone",
  },
  {
    value: DeityType.DioSupremo,
    label: "Padrone dei Tre Mondi",
  },
  {
    value: DeityType.Divino,
    label: "Celestiale",
  },
  {
    value: DeityType.Elementale,
    label: "Elementale",
  },
  {
    value: DeityType.Fatato,
    label: "Fatato",
  },
];

export default deityTypes;
