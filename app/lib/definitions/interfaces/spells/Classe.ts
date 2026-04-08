import TipoTradizione from "@/app/lib/definitions/enums/deities/TipoTradizione";

interface Classe {
  value: number;
  scuola: TipoTradizione;
  label: string;
  subGroups: number[];
}

export default Classe;
