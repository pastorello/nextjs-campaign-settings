import AlignmentDomain from "@/app/lib/definitions/enums/npc/AlignmentDomain";

export interface AlignmentDomainObject {
  type: AlignmentDomain;
  value: number;
  labelKey: string;
}

const alignmentDomains: AlignmentDomainObject[] = [
  {
    value: 0,
    labelKey: "npc.alignmentDomains.law",
    type: AlignmentDomain.Legge,
  },
  {
    value: 1,
    labelKey: "npc.alignmentDomains.neutrality",
    type: AlignmentDomain.Neutrale,
  },
  {
    value: 2,
    labelKey: "npc.alignmentDomains.chaos",
    type: AlignmentDomain.Caos,
  },
];

export default alignmentDomains;
