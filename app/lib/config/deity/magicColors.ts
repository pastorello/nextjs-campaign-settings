import MagicColor from "@/app/lib//definitions/enums/deities/MagicColor";

export interface MagicColorObject {
  type: MagicColor;
  value: number;
  label: string;
  colorClass: string;
}

const magicColors: MagicColorObject[] = [
  {
    value: 0,
    label: MagicColor.Arancione,
    type: MagicColor.Arancione,
    colorClass: "border-orange-600",
  },
  {
    value: 1,
    label: MagicColor.Blu,
    type: MagicColor.Blu,
    colorClass: "border-blue-600",
  },
  {
    value: 2,
    label: MagicColor.Giallo,
    type: MagicColor.Giallo,
    colorClass: "border-yellow-500",
  },
  {
    value: 3,
    label: MagicColor.Indaco,
    type: MagicColor.Indaco,
    colorClass: "border-indigo-500",
  },
  {
    value: 4,
    label: MagicColor.Rosso,
    type: MagicColor.Rosso,
    colorClass: "border-red-500",
  },
  {
    value: 5,
    label: MagicColor.Verde,
    type: MagicColor.Verde,
    colorClass: "border-green-500",
  },
  {
    value: 6,
    label: MagicColor.Violetto,
    type: MagicColor.Violetto,
    colorClass: "border-violet-500",
  },
  {
    value: 7,
    label: MagicColor.Tutti,
    type: MagicColor.Tutti,
    colorClass: "border-slate-800",
  },
];

export default magicColors;
