import NpcMetaField from "../../enums/npc/NpcMetaField";

interface DBNpcItem {
  id: number;
  [NpcMetaField.name]: string;
  [NpcMetaField.description]: string;
  [NpcMetaField.title]: string;
  [NpcMetaField.alignment]: number;
  [NpcMetaField.alignmentDomain]: number;
  [NpcMetaField.position]: string;
  [NpcMetaField.faction]: number;
  [NpcMetaField.appearance]: string;
  [NpcMetaField.personality]: string;
  [NpcMetaField.motivations]: string;
  [NpcMetaField.secrets]: string;
}

export default DBNpcItem;
