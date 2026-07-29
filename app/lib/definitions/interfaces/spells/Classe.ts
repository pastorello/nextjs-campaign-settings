import TraditionType from "@/app/lib/definitions/enums/deities/TraditionType";

interface Classe {
  value: number;
  scuola: TraditionType;
  label: string;
  subGroups: number[];
}

export default Classe;
