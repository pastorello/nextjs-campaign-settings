import TipoTradizione from "../../definitions/enums/deities/TipoTradizione";
import SelectOption from "../../definitions/types/SelectOption";

const traditionTypes: SelectOption[] = [
  {
    value: TipoTradizione.Arcana,
    label: "Arcana",
  },
  {
    value: TipoTradizione.Divina,
    label: "Divina",
  },
  {
    value: TipoTradizione.Occulta,
    label: "Occulta",
  },
  {
    value: TipoTradizione.Primeva,
    label: "Primeva",
  },
  {
    value: TipoTradizione.Ultraterrena,
    label: "Ultraterrena",
  },
];

export default traditionTypes;
