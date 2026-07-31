import Faction from "@/app/lib/definitions/enums/npc/Faction";
import FactionItem from "@/app/lib/definitions/interfaces/npc/FactionItem";

const factions: FactionItem[] = [
  {
    value: 0,
    type: Faction.RegnoBianco,
    labelKey: "npc.factions.regnoBianco",
  },
  { value: 1, type: Faction.RegnoRosso, labelKey: "npc.factions.regnoRosso" },
  {
    value: 2,
    type: Faction.RegnoGrigio,
    labelKey: "npc.factions.regnoGrigio",
  },
  { value: 3, type: Faction.RegnoVerde, labelKey: "npc.factions.regnoVerde" },
  {
    value: 4,
    type: Faction.RegnoGiallo,
    labelKey: "npc.factions.regnoGiallo",
  },
  {
    value: 5,
    type: Faction.RegnoAzzurro,
    labelKey: "npc.factions.regnoAzzurro",
  },
  { value: 6, type: Faction.RegnoNero, labelKey: "npc.factions.regnoNero" },
  { value: 7, type: Faction.Valleferro, labelKey: "npc.factions.valleferro" },
  { value: 8, type: Faction.Skreebars, labelKey: "npc.factions.skreebars" },
  { value: 10, type: Faction.Raminghi, labelKey: "npc.factions.raminghi" },
  {
    value: 11,
    type: Faction.CustodiBianchi,
    labelKey: "npc.factions.custodiBianchi",
  },
  {
    value: 12,
    type: Faction.CustodiVerdi,
    labelKey: "npc.factions.custodiVerdi",
  },
  {
    value: 13,
    type: Faction.CustodiNeri,
    labelKey: "npc.factions.custodiNeri",
  },
  {
    value: 14,
    type: Faction.MaghiBianchi,
    labelKey: "npc.factions.maghiBianchi",
  },
  {
    value: 15,
    type: Faction.MaghiGrigi,
    labelKey: "npc.factions.maghiGrigi",
  },
  { value: 16, type: Faction.MaghiNeri, labelKey: "npc.factions.maghiNeri" },
  {
    value: 17,
    type: Faction.PaladiniBianchi,
    labelKey: "npc.factions.paladiniBianchi",
  },
  {
    value: 18,
    type: Faction.DemoniRossi,
    labelKey: "npc.factions.demoniRossi",
  },
  { value: 19, type: Faction.Annunaki, labelKey: "npc.factions.annunaki" },
  { value: 21, type: Faction.Folletti, labelKey: "npc.factions.folletti" },
  { value: 22, type: Faction.ManoNera, labelKey: "npc.factions.manoNera" },
];

export default factions;
