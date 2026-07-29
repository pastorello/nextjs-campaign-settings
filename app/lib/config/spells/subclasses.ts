import TraditionType from "@/app/lib/definitions/enums/deities/TraditionType";
import Subclass from "@/app/lib/definitions/enums/spells/Subclass";

interface SottoClasseObject {
  type: Subclass;
  value: number;
  label: string;
  titolo: string;
  tradizione: TraditionType;
}

const subclasses: SottoClasseObject[] = [
  {
    type: Subclass.BardoSapienza,
    value: Subclass.BardoSapienza,
    label: "Bardo - Collegio della Sapienza",
    titolo: "Occultista",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.BardoValore,
    value: Subclass.BardoValore,
    label: "Bardo - Collegio del Valore",
    titolo: "Cantore",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.CavaliereNero,
    value: Subclass.CavaliereNero,
    label: "Paladino - Cavaliere Nero",
    titolo: "Cavaliere Nero",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.CavaliereBianco,
    value: Subclass.CavaliereBianco,
    label: "Paladino - Cavaliere Bianco",
    titolo: "Cavaliere Bianco",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.CavaliereVerde,
    value: Subclass.CavaliereVerde,
    label: "Paladino - Cavaliere Verde",
    titolo: "Cavaliere Verde",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.ElementaristaFuoco,
    value: Subclass.ElementaristaFuoco,
    label: "Stregone - Magia del Vulcano",
    titolo: "Stregone del Fuoco",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.ElementaristaAcqua,
    value: Subclass.ElementaristaAcqua,
    label: "Stregone - Magia delle Tempeste",
    titolo: "Stregone delle Tempeste",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.Fattucchiere,
    value: Subclass.Fattucchiere,
    label: "Stregone - Magia Selvaggia",
    titolo: "Fattucchiere",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.DruidoTerra,
    value: Subclass.DruidoTerra,
    label: "Druido - Circle della Terra",
    titolo: "Druido dei Boschi",
    tradizione: TraditionType.Primeva,
  },
  {
    type: Subclass.DruidoLuna,
    value: Subclass.DruidoLuna,
    label: "Druido - Circle della Luna",
    titolo: "Druido Lunare",
    tradizione: TraditionType.Primeva,
  },
  {
    type: Subclass.WarlockFatato,
    value: Subclass.WarlockFatato,
    label: "Warlock - Patrono Fatato",
    titolo: "Warlock Fatato",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.WarlockAntico,
    value: Subclass.WarlockAntico,
    label: "Warlock - Patrono Grande Antico",
    titolo: "Warlock delle Ombre",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.WarlockImmondo,
    value: Subclass.WarlockImmondo,
    label: "Warlock - Patrono Immondo",
    titolo: "Warlock Infernale",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.Strega,
    value: Subclass.Strega,
    label: "Mago - Ammaliatore",
    titolo: "Mago Nero",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.MaestroRune,
    value: Subclass.MaestroRune,
    label: "Mago - Abiuratore",
    titolo: "Maestro delle Rune",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.Oracolo,
    value: Subclass.Oracolo,
    label: "Mago - Divinatore",
    titolo: "Oracolo",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.MagoBianco,
    value: Subclass.MagoBianco,
    label: "Mago - Trasmutatore",
    titolo: "Mago Bianco",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.Necromante,
    value: Subclass.Necromante,
    label: "Mago - Necromante",
    titolo: "Necromante",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.ChiericoMorte,
    value: Subclass.ChiericoMorte,
    label: "Chierico - Dominio della Sapienza",
    titolo: "Custode delle Tombe",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.ChiericoOscuro,
    value: Subclass.ChiericoOscuro,
    label: "Chierico - Dominio dell'Inaganno",
    titolo: "Chierico Oscuro",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.ChiericoVita,
    value: Subclass.ChiericoVita,
    label: "Chierico - Dominio della Luce",
    titolo: "Custode della Fiamma",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.Ranger,
    value: Subclass.Ranger,
    label: "Ranger",
    titolo: "Custode dei Boschi",
    tradizione: TraditionType.Primeva,
  },
  {
    type: Subclass.Nessuna,
    value: Subclass.Nessuna,
    label: "Nessuna",
    titolo: "Nessun titolo",
    tradizione: TraditionType.Ultraterrena,
  },
];

// Read once, before sorting: this is the "Nessuna" entry, which is pinned to
// the end of the list. Reading it inside the comparator also meant re-reading a
// list that the sort was busy reordering.
const lastEntry = subclasses[subclasses.length - 1];

export default subclasses.sort((a, b) => {
  if (a.value === lastEntry?.value) {
    return 1;
  }
  if (b.value === lastEntry?.value) {
    return -1;
  }
  return a.label.localeCompare(b.label);
});
