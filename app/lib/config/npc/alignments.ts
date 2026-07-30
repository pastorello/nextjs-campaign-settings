import Alignment from "../../definitions/enums/npc/Alignment";
import SelectOption from "../../definitions/types/SelectOption";

export interface AlignmentObject extends SelectOption<number> {
  type: Alignment;
}

const alignments: AlignmentObject[] = [
  { value: 0, label: Alignment.Bene, type: Alignment.Bene },
  { value: 1, label: Alignment.Neutrale, type: Alignment.Neutrale },
  { value: 2, label: Alignment.Male, type: Alignment.Male },
];

export default alignments;
