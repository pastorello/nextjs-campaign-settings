import TraditionType from "@/app/lib/definitions/enums/deities/TraditionType";

interface Class {
  value: number;
  school: TraditionType;
  labelKey: string;
  subGroups: number[];
}

export default Class;
