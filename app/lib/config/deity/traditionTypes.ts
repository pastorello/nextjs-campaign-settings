import TraditionType from "../../definitions/enums/deities/TraditionType";
import SelectOption from "../../definitions/types/SelectOption";

const traditionTypes: SelectOption<number>[] = [
  {
    value: TraditionType.Arcana,
    labelKey: "deities.traditions.arcana",
  },
  {
    value: TraditionType.Divina,
    labelKey: "deities.traditions.divina",
  },
  {
    value: TraditionType.Occulta,
    labelKey: "deities.traditions.occulta",
  },
  {
    value: TraditionType.Primeva,
    labelKey: "deities.traditions.primeva",
  },
  {
    value: TraditionType.Ultraterrena,
    labelKey: "deities.traditions.ultraterrena",
  },
];

export default traditionTypes;
