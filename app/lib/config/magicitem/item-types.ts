import MagicItemType from "@/app/lib/definitions/enums/magicitem/MagicItemType";

interface MagicItemTypeObject {
  type: MagicItemType;
  value: number;
  label: string;
}

const itemTypes: MagicItemTypeObject[] = [
  { value: 0, label: "Anello", type: MagicItemType.Anello },
  { value: 1, label: "Arma", type: MagicItemType.Arma },
  { value: 2, label: "Armatura", type: MagicItemType.Armatura },
  { value: 3, label: "Bacchetta", type: MagicItemType.Bacchetta },
  { value: 4, label: "Bastone", type: MagicItemType.Bastone },
  {
    value: 5,
    label: "Oggetto Meraviglioso",
    type: MagicItemType.OggettoMeraviglioso,
  },
  { value: 6, label: "Pergamena", type: MagicItemType.Pergamena },
  { value: 7, label: "Pozione", type: MagicItemType.Pozione },
  { value: 8, label: "Verga", type: MagicItemType.Verga },
];

export default itemTypes;
