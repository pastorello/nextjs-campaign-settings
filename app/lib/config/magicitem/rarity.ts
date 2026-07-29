import Rarity from "@/app/lib/definitions/enums/magicitem/Rarity";

export interface RarityObject {
  type: Rarity;
  value: number;
  label: string;
}

const rarity: RarityObject[] = [
  { value: 0, label: "Comune", type: Rarity.Common },
  { value: 1, label: "Non comune", type: Rarity.Uncommon },
  { value: 2, label: "Raro", type: Rarity.Rare },
  { value: 3, label: "Molto Raro", type: Rarity.VeryRare },
  { value: 4, label: "Leggendario", type: Rarity.Legendary },
  { value: 5, label: "Artefatto", type: Rarity.Artifact },
  { value: 6, label: "Variabile", type: Rarity.Variable },
];

export default rarity;
