import Alignment from "../../definitions/enums/npc/Alignment";
import SelectOption from "../../definitions/types/SelectOption";

export interface AlignmentObject extends SelectOption<number> {
  type: Alignment;
}

const alignments: AlignmentObject[] = [
  { value: 0, labelKey: "npc.alignments.good", type: Alignment.Bene },
  { value: 1, labelKey: "npc.alignments.neutral", type: Alignment.Neutrale },
  { value: 2, labelKey: "npc.alignments.evil", type: Alignment.Male },
];

export default alignments;
