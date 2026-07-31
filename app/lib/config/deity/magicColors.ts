import MagicColor from "@/app/lib//definitions/enums/deities/MagicColor";

export interface MagicColorObject {
  type: MagicColor;
  value: number;
  labelKey: string;
  colorClass: string;
}

const magicColors: MagicColorObject[] = [
  {
    value: 0,
    labelKey: "deities.colors.arancione",
    type: MagicColor.Arancione,
    colorClass: "border-orange-600",
  },
  {
    value: 1,
    labelKey: "deities.colors.blu",
    type: MagicColor.Blu,
    colorClass: "border-blue-600",
  },
  {
    value: 2,
    labelKey: "deities.colors.giallo",
    type: MagicColor.Giallo,
    colorClass: "border-yellow-500",
  },
  {
    value: 3,
    labelKey: "deities.colors.indaco",
    type: MagicColor.Indaco,
    colorClass: "border-indigo-500",
  },
  {
    value: 4,
    labelKey: "deities.colors.rosso",
    type: MagicColor.Rosso,
    colorClass: "border-red-500",
  },
  {
    value: 5,
    labelKey: "deities.colors.verde",
    type: MagicColor.Verde,
    colorClass: "border-green-500",
  },
  {
    value: 6,
    labelKey: "deities.colors.violetto",
    type: MagicColor.Violetto,
    colorClass: "border-violet-500",
  },
  {
    value: 7,
    labelKey: "deities.colors.tutti",
    type: MagicColor.Tutti,
    colorClass: "border-slate-800",
  },
];

export default magicColors;
