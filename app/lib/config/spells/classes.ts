import TipoTradizione from "@/app/lib/definitions/enums/deities/TipoTradizione";
import Classe from "@/app/lib/definitions/interfaces/spells/Classe";

const classes: Classe[] = [
  {
    value: 0,
    label: "Bardo",
    scuola: TipoTradizione.Occulta,
    subGroups: [0, 1],
  },
  {
    value: 1,
    label: "Chierico",
    scuola: TipoTradizione.Divina,
    subGroups: [18, 19, 20],
  },
  {
    value: 2,
    label: "Druido",
    scuola: TipoTradizione.Primeva,
    subGroups: [8, 9],
  },
  {
    value: 3,
    label: "Mago",
    scuola: TipoTradizione.Arcana,
    subGroups: [13, 14, 15, 16, 17],
  },
  {
    value: 4,
    label: "Paladino",
    scuola: TipoTradizione.Divina,
    subGroups: [2, 3, 4],
  },
  {
    value: 5,
    label: "Ranger",
    scuola: TipoTradizione.Primeva,
    subGroups: [21],
  },
  {
    value: 6,
    label: "Stregone",
    scuola: TipoTradizione.Arcana,
    subGroups: [5, 6, 7],
  },

  {
    value: 7,
    label: "Warlock",
    scuola: TipoTradizione.Occulta,
    subGroups: [10, 11, 12],
  },
];

export default classes;
