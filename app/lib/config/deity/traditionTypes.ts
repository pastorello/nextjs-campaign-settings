import TraditionType from "../../definitions/enums/deities/TraditionType";
import SelectOption from "../../definitions/types/SelectOption";

const traditionTypes: SelectOption<number>[] = [
  {
    value: TraditionType.Arcana,
    label: "Arcana",
  },
  {
    value: TraditionType.Divina,
    label: "Divina",
  },
  {
    value: TraditionType.Occulta,
    label: "Occulta",
  },
  {
    value: TraditionType.Primeva,
    label: "Primeva",
  },
  {
    value: TraditionType.Ultraterrena,
    label: "Ultraterrena",
  },
];

export default traditionTypes;
