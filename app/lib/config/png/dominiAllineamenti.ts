import DominioAllineamento from "@/app/lib/definitions/enums/png/DominioAllineamento";

export interface DominiAllineamentiObject {
  type: DominioAllineamento;
  value: number;
  label: string;
}

const dominiAllineamenti: DominiAllineamentiObject[] = [
  {
    value: 0,
    label: DominioAllineamento.Legge,
    type: DominioAllineamento.Legge,
  },
  {
    value: 1,
    label: DominioAllineamento.Neutrale,
    type: DominioAllineamento.Neutrale,
  },
  {
    value: 2,
    label: DominioAllineamento.Caos,
    type: DominioAllineamento.Caos,
  },
];

export default dominiAllineamenti;
