import Durata from "@/app/lib/definitions/interfaces/spells/Durata";

const durate: Durata[] = [
  { value: "Istantanea", label: "Istantanea" },
  { value: "Concentrazione01", label: "Concentrazione, fino a 1 round" },
  { value: "Concentrazione06", label: "Concentrazione, fino a 6 round" },
  { value: "Concentrazione1", label: "Concentrazione, fino a 1 minuto" },
  { value: "Concentrazione10", label: "Concentrazione, fino a 10 minuti" },
  { value: "Concentrazione60", label: "Concentrazione, fino a 1 ora" },
  { value: "Concentrazione120", label: "Concentrazione, fino a 2 ore" },
  { value: "Concentrazione480", label: "Concentrazione, fino a 8 ore" },
  { value: "Concentrazione1g", label: "Concentrazione, fino a 24 ore" },
  { value: "1 round", label: "1 round" },
  { value: "1 minuto", label: "1 minuto" },
  { value: "10 minuti", label: "10 minuti" },
  { value: "1 ora", label: "1 ora" },
  { value: "8 ore", label: "8 ore" },
  { value: "24 ore", label: "24 ore" },
  { value: "7 giorni", label: "7 giorni" },
  { value: "10 giorni", label: "10 giorni" },
  { value: "30 giorni", label: "30 giorni" },
  { value: "Permanente", label: "Finchè non viene dissolto" },
  { value: "Innesco", label: "Finchè non viene dissolto o innescato" },
  { value: "Speciale", label: "Speciale" },
];

export default durate;
