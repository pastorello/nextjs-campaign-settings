import AlignmentDomain from "@/app/lib/definitions/enums/npc/AlignmentDomain";

export interface DominiAllineamentiObject {
  type: AlignmentDomain;
  value: number;
  label: string;
}

const dominiAllineamenti: DominiAllineamentiObject[] = [
  {
    value: 0,
    label: AlignmentDomain.Legge,
    type: AlignmentDomain.Legge,
  },
  {
    value: 1,
    label: AlignmentDomain.Neutrale,
    type: AlignmentDomain.Neutrale,
  },
  {
    value: 2,
    label: AlignmentDomain.Caos,
    type: AlignmentDomain.Caos,
  },
];

export default dominiAllineamenti;
