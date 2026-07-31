import TraditionType from "@/app/lib/definitions/enums/deities/TraditionType";
import Classe from "@/app/lib/definitions/interfaces/spells/Classe";

const classes: Classe[] = [
  {
    value: 0,
    labelKey: "spells.classes.bard",
    scuola: TraditionType.Occulta,
    subGroups: [0, 1],
  },
  {
    value: 1,
    labelKey: "spells.classes.cleric",
    scuola: TraditionType.Divina,
    subGroups: [18, 19, 20],
  },
  {
    value: 2,
    labelKey: "spells.classes.druid",
    scuola: TraditionType.Primeva,
    subGroups: [8, 9],
  },
  {
    value: 3,
    labelKey: "spells.classes.wizard",
    scuola: TraditionType.Arcana,
    subGroups: [13, 14, 15, 16, 17],
  },
  {
    value: 4,
    labelKey: "spells.classes.paladin",
    scuola: TraditionType.Divina,
    subGroups: [2, 3, 4],
  },
  {
    value: 5,
    labelKey: "spells.classes.ranger",
    scuola: TraditionType.Primeva,
    subGroups: [21],
  },
  {
    value: 6,
    labelKey: "spells.classes.sorcerer",
    scuola: TraditionType.Arcana,
    subGroups: [5, 6, 7],
  },

  {
    value: 7,
    labelKey: "spells.classes.warlock",
    scuola: TraditionType.Occulta,
    subGroups: [10, 11, 12],
  },
];

export default classes;
