import Faction from "@/app/lib/definitions/enums/npc/Faction";

interface FactionItem {
  labelKey: string;
  value: number;
  type: Faction;
}

export default FactionItem;
