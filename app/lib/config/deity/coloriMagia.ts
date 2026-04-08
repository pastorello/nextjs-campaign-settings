import ColoreMagia from "@/app/lib//definitions/enums/deities/ColoreMagia";

export interface ColoreMagiaObject {
  type: ColoreMagia;
  value: number;
  label: string;
  colorClass: string;
}

const coloriMagia: ColoreMagiaObject[] = [
  {
    value: 0,
    label: ColoreMagia.Arancione,
    type: ColoreMagia.Arancione,
    colorClass: "border-orange-600",
  },
  {
    value: 1,
    label: ColoreMagia.Blu,
    type: ColoreMagia.Blu,
    colorClass: "border-blue-600",
  },
  {
    value: 2,
    label: ColoreMagia.Giallo,
    type: ColoreMagia.Giallo,
    colorClass: "border-yellow-500",
  },
  {
    value: 3,
    label: ColoreMagia.Indaco,
    type: ColoreMagia.Indaco,
    colorClass: "border-indigo-500",
  },
  {
    value: 4,
    label: ColoreMagia.Rosso,
    type: ColoreMagia.Rosso,
    colorClass: "border-red-500",
  },
  {
    value: 5,
    label: ColoreMagia.Verde,
    type: ColoreMagia.Verde,
    colorClass: "border-green-500",
  },
  {
    value: 6,
    label: ColoreMagia.Violetto,
    type: ColoreMagia.Violetto,
    colorClass: "border-violet-500",
  },
  {
    value: 7,
    label: ColoreMagia.Tutti,
    type: ColoreMagia.Tutti,
    colorClass: "border-slate-800",
  },
];

export default coloriMagia;
