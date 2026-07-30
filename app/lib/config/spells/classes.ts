import TraditionType from "@/app/lib/definitions/enums/deities/TraditionType";
import Classe from "@/app/lib/definitions/interfaces/spells/Classe";

const classes: Classe[] = [
  {
    value: 0,
    label: "Bardo",
    scuola: TraditionType.Occulta,
    subGroups: [0, 1],
  },
  {
    value: 1,
    label: "Chierico",
    scuola: TraditionType.Divina,
    subGroups: [18, 19, 20],
  },
  {
    value: 2,
    label: "Druido",
    scuola: TraditionType.Primeva,
    subGroups: [8, 9],
  },
  {
    value: 3,
    label: "Mago",
    scuola: TraditionType.Arcana,
    subGroups: [13, 14, 15, 16, 17],
  },
  {
    value: 4,
    label: "Paladino",
    scuola: TraditionType.Divina,
    subGroups: [2, 3, 4],
  },
  {
    value: 5,
    label: "Ranger",
    scuola: TraditionType.Primeva,
    subGroups: [21],
  },
  {
    value: 6,
    label: "Stregone",
    scuola: TraditionType.Arcana,
    subGroups: [5, 6, 7],
  },

  {
    value: 7,
    label: "Warlock",
    scuola: TraditionType.Occulta,
    subGroups: [10, 11, 12],
  },
];

export default classes;
