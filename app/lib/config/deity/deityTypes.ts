import TipoPatrono from "../../definitions/enums/deities/TipoPatrono";
import SelectOption from "../../definitions/types/SelectOption";

const deityTypes: SelectOption[] = [
  {
    value: TipoPatrono.Arconte,
    label: "Arconte",
  },
  {
    value: TipoPatrono.Demone,
    label: "Demone",
  },
  {
    value: TipoPatrono.DioSupremo,
    label: "Padrone dei Tre Mondi",
  },
  {
    value: TipoPatrono.Divino,
    label: "Celestiale",
  },
  {
    value: TipoPatrono.Elementale,
    label: "Elementale",
  },
  {
    value: TipoPatrono.Fatato,
    label: "Fatato",
  },
];

export default deityTypes;
