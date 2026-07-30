import Faction from "@/app/lib/definitions/enums/npc/Faction";
import FazioneItem from "@/app/lib/definitions/interfaces/npc/FazioneItem";

const fazioni: FazioneItem[] = [
  { value: 0, type: Faction.RegnoBianco, label: "Regno di Kang" },
  { value: 1, type: Faction.RegnoRosso, label: "Orda dei Pelleverde" },
  { value: 2, type: Faction.RegnoGrigio, label: "Sultani di Solenero" },
  { value: 3, type: Faction.RegnoVerde, label: "Elfi Lunari" },
  { value: 4, type: Faction.RegnoGiallo, label: "Nani di Butwhag" },
  { value: 5, type: Faction.RegnoAzzurro, label: "Orde dei Barbari" },
  { value: 6, type: Faction.RegnoNero, label: "Regno di Blackthorne" },
  { value: 7, type: Faction.Valleferro, label: "Contea di Valleferro" },
  { value: 8, type: Faction.Skreebars, label: "Ducato di Skreebars" },
  { value: 10, type: Faction.Raminghi, label: "Raminghi" },
  { value: 11, type: Faction.CustodiBianchi, label: "Custodi della Fiamma" },
  { value: 12, type: Faction.CustodiVerdi, label: "Custodi dell'Albero Sacro" },
  { value: 13, type: Faction.CustodiNeri, label: "Custodi delle Rune" },
  {
    value: 14,
    type: Faction.MaghiBianchi,
    label: "Accademia degli Illuminati",
  },
  { value: 15, type: Faction.MaghiGrigi, label: "Scuola dell'Invisibile" },
  { value: 16, type: Faction.MaghiNeri, label: "Congrega delle Megere" },
  {
    value: 17,
    type: Faction.PaladiniBianchi,
    label: "Cavalieri dell'Ordine della Rosa",
  },
  { value: 18, type: Faction.DemoniRossi, label: "Demoni Rossi" },
  { value: 19, type: Faction.Annunaki, label: "Annunaki" },
  { value: 21, type: Faction.Folletti, label: "Folletti" },
  { value: 22, type: Faction.ManoNera, label: "Mano Nera" },
];

export default fazioni;
