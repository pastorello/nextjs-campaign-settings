import Element from "../../definitions/enums/deities/Element";
import SelectOption from "../../definitions/types/SelectOption";

const energyElements: SelectOption<number>[] = [
  {
    value: Element.Acqua,
    label: "Acqua",
  },
  {
    value: Element.Aria,
    label: "Aria",
  },
  {
    value: Element.Fuoco,
    label: "Fuoco",
  },
  {
    value: Element.Spirito,
    label: "Spirito",
  },
  {
    value: Element.Terra,
    label: "Terra",
  },
  {
    value: Element.Vuoto,
    label: "Vuoto",
  },
];

export default energyElements;
