import TraditionType from "@/app/lib/definitions/enums/deities/TraditionType";

interface Classe {
  value: number;
  scuola: TraditionType;
  labelKey: string;
  subGroups: number[];
}

export default Classe;
