import Fazione from "@/app/lib/definitions/enums/png/Fazione";
import FazioneItem from "@/app/lib/definitions/interfaces/png/FazioneItem";

const fazioni: FazioneItem[] = [
  { value: 0, type: Fazione.RegnoBianco, label: "Regno di Kang" },
  { value: 1, type: Fazione.RegnoRosso, label: "Orda dei Pelleverde" },
  { value: 2, type: Fazione.RegnoGrigio, label: "Sultani di Solenero" },
  { value: 3, type: Fazione.RegnoVerde, label: "Elfi Lunari" },
  { value: 4, type: Fazione.RegnoGiallo, label: "Nani di Butwhag" },
  { value: 5, type: Fazione.RegnoAzzurro, label: "Orde dei Barbari" },
  { value: 6, type: Fazione.RegnoNero, label: "Regno di Blackthorne" },
  { value: 7, type: Fazione.Valleferro, label: "Contea di Valleferro" },
  { value: 8, type: Fazione.Skreebars, label: "Ducato di Skreebars" },
  { value: 10, type: Fazione.Raminghi, label: "Raminghi" },
  { value: 11, type: Fazione.CustodiBianchi, label: "Custodi della Fiamma" },
  { value: 12, type: Fazione.CustodiVerdi, label: "Custodi dell'Albero Sacro" },
  { value: 13, type: Fazione.CustodiNeri, label: "Custodi delle Rune" },
  {
    value: 14,
    type: Fazione.MaghiBianchi,
    label: "Accademia degli Illuminati",
  },
  { value: 15, type: Fazione.MaghiGrigi, label: "Scuola dell'Invisibile" },
  { value: 16, type: Fazione.MaghiNeri, label: "Congrega delle Megere" },
  {
    value: 17,
    type: Fazione.PaladiniBianchi,
    label: "Cavalieri dell'Ordine della Rosa",
  },
  { value: 18, type: Fazione.DemoniRossi, label: "Demoni Rossi" },
  { value: 19, type: Fazione.Annunaki, label: "Annunaki" },
  { value: 21, type: Fazione.Folletti, label: "Folletti" },
  { value: 22, type: Fazione.ManoNera, label: "Mano Nera" },
];

export default fazioni;
