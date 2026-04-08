import Rarita from "@/app/lib/definitions/enums/magicitem/Rarita";

export interface RaritaObject {
  type: Rarita;
  value: number;
  label: string;
}

const rarity: RaritaObject[] = [
  { value: 0, label: "Comune", type: Rarita.Comune },
  { value: 1, label: "Non comune", type: Rarita.NonComune },
  { value: 2, label: "Raro", type: Rarita.Raro },
  { value: 3, label: "Molto Raro", type: Rarita.MoltoRaro },
  { value: 4, label: "Leggendario", type: Rarita.Leggendario },
  { value: 5, label: "Artefatto", type: Rarita.Artefatto },
  { value: 6, label: "Variabile", type: Rarita.Variabile },
];

export default rarity;
