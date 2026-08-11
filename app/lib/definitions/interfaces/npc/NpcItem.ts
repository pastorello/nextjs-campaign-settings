import NpcMetaField from "../../enums/npc/NpcMetaField";

interface NpcItem {
  id: number;
  [NpcMetaField.name]: string;
  [NpcMetaField.description]: string;
  [NpcMetaField.title]: string;
  [NpcMetaField.alignment]: number;
  [NpcMetaField.alignmentDomain]: number;
  [NpcMetaField.position]: string;
  [NpcMetaField.faction]: number | null;
  [NpcMetaField.appearance]: string;
  [NpcMetaField.personality]: string;
  [NpcMetaField.motivations]: string;
  [NpcMetaField.secrets]: string;
}

export default NpcItem;
