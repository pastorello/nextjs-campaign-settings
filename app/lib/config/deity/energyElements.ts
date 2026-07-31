import Element from "../../definitions/enums/deities/Element";
import SelectOption from "../../definitions/types/SelectOption";

const energyElements: SelectOption<number>[] = [
  {
    value: Element.Acqua,
    labelKey: "deities.elements.acqua",
  },
  {
    value: Element.Aria,
    labelKey: "deities.elements.aria",
  },
  {
    value: Element.Fuoco,
    labelKey: "deities.elements.fuoco",
  },
  {
    value: Element.Spirito,
    labelKey: "deities.elements.spirito",
  },
  {
    value: Element.Terra,
    labelKey: "deities.elements.terra",
  },
  {
    value: Element.Vuoto,
    labelKey: "deities.elements.vuoto",
  },
];

export default energyElements;
