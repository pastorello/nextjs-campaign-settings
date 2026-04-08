import Allineamento from "../../definitions/enums/png/Allineamento";
import SelectOption from "../../definitions/types/SelectOption";

export interface AllineamentoObject extends SelectOption {
  type: Allineamento;
}

const allineamenti: AllineamentoObject[] = [
  { value: 0, label: Allineamento.Bene, type: Allineamento.Bene },
  { value: 1, label: Allineamento.Neutrale, type: Allineamento.Neutrale },
  { value: 2, label: Allineamento.Male, type: Allineamento.Male },
];

export default allineamenti;
