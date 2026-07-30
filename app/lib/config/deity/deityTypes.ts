import DeityType from "../../definitions/enums/deities/DeityType";
import SelectOption from "../../definitions/types/SelectOption";

const deityTypes: SelectOption<number>[] = [
  {
    value: DeityType.Arconte,
    labelKey: "deities.types.arconte",
  },
  {
    value: DeityType.Demone,
    labelKey: "deities.types.demone",
  },
  {
    value: DeityType.DioSupremo,
    labelKey: "deities.types.dioSupremo",
  },
  {
    value: DeityType.Divino,
    labelKey: "deities.types.divino",
  },
  {
    value: DeityType.Elementale,
    labelKey: "deities.types.elementale",
  },
  {
    value: DeityType.Fatato,
    labelKey: "deities.types.fatato",
  },
];

export default deityTypes;
