import TraditionType from "@/app/lib/definitions/enums/deities/TraditionType";
import Subclass from "@/app/lib/definitions/enums/spells/Subclass";

interface SottoClasseObject {
  type: Subclass;
  value: number;
  labelKey: string;
  titolo: string;
  tradizione: TraditionType;
}

const subclasses: SottoClasseObject[] = [
  {
    type: Subclass.BardoSapienza,
    value: Subclass.BardoSapienza,
    labelKey: "spells.subclasses.bardoSapienza",
    titolo: "Occultista",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.BardoValore,
    value: Subclass.BardoValore,
    labelKey: "spells.subclasses.bardoValore",
    titolo: "Cantore",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.CavaliereNero,
    value: Subclass.CavaliereNero,
    labelKey: "spells.subclasses.cavaliereNero",
    titolo: "Cavaliere Nero",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.CavaliereBianco,
    value: Subclass.CavaliereBianco,
    labelKey: "spells.subclasses.cavaliereBianco",
    titolo: "Cavaliere Bianco",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.CavaliereVerde,
    value: Subclass.CavaliereVerde,
    labelKey: "spells.subclasses.cavaliereVerde",
    titolo: "Cavaliere Verde",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.ElementaristaFuoco,
    value: Subclass.ElementaristaFuoco,
    labelKey: "spells.subclasses.elementaristaFuoco",
    titolo: "Stregone del Fuoco",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.ElementaristaAcqua,
    value: Subclass.ElementaristaAcqua,
    labelKey: "spells.subclasses.elementaristaAcqua",
    titolo: "Stregone delle Tempeste",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.Fattucchiere,
    value: Subclass.Fattucchiere,
    labelKey: "spells.subclasses.fattucchiere",
    titolo: "Fattucchiere",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.DruidoTerra,
    value: Subclass.DruidoTerra,
    labelKey: "spells.subclasses.druidoTerra",
    titolo: "Druido dei Boschi",
    tradizione: TraditionType.Primeva,
  },
  {
    type: Subclass.DruidoLuna,
    value: Subclass.DruidoLuna,
    labelKey: "spells.subclasses.druidoLuna",
    titolo: "Druido Lunare",
    tradizione: TraditionType.Primeva,
  },
  {
    type: Subclass.WarlockFatato,
    value: Subclass.WarlockFatato,
    labelKey: "spells.subclasses.warlockFatato",
    titolo: "Warlock Fatato",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.WarlockAntico,
    value: Subclass.WarlockAntico,
    labelKey: "spells.subclasses.warlockAntico",
    titolo: "Warlock delle Ombre",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.WarlockImmondo,
    value: Subclass.WarlockImmondo,
    labelKey: "spells.subclasses.warlockImmondo",
    titolo: "Warlock Infernale",
    tradizione: TraditionType.Occulta,
  },
  {
    type: Subclass.Strega,
    value: Subclass.Strega,
    labelKey: "spells.subclasses.strega",
    titolo: "Mago Nero",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.MaestroRune,
    value: Subclass.MaestroRune,
    labelKey: "spells.subclasses.maestroRune",
    titolo: "Maestro delle Rune",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.Oracolo,
    value: Subclass.Oracolo,
    labelKey: "spells.subclasses.oracolo",
    titolo: "Oracolo",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.MagoBianco,
    value: Subclass.MagoBianco,
    labelKey: "spells.subclasses.magoBianco",
    titolo: "Mago Bianco",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.Necromante,
    value: Subclass.Necromante,
    labelKey: "spells.subclasses.necromante",
    titolo: "Necromante",
    tradizione: TraditionType.Arcana,
  },
  {
    type: Subclass.ChiericoMorte,
    value: Subclass.ChiericoMorte,
    labelKey: "spells.subclasses.chiericoMorte",
    titolo: "Custode delle Tombe",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.ChiericoOscuro,
    value: Subclass.ChiericoOscuro,
    labelKey: "spells.subclasses.chiericoOscuro",
    titolo: "Chierico Oscuro",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.ChiericoVita,
    value: Subclass.ChiericoVita,
    labelKey: "spells.subclasses.chiericoVita",
    titolo: "Custode della Fiamma",
    tradizione: TraditionType.Divina,
  },
  {
    type: Subclass.Ranger,
    value: Subclass.Ranger,
    labelKey: "spells.subclasses.ranger",
    titolo: "Custode dei Boschi",
    tradizione: TraditionType.Primeva,
  },
  {
    type: Subclass.Nessuna,
    value: Subclass.Nessuna,
    labelKey: "spells.subclasses.nessuna",
    titolo: "Nessun titolo",
    tradizione: TraditionType.Ultraterrena,
  },
];

// Read once, before sorting: this is the "Nessuna" entry, which is pinned to
// the end of the list. Reading it inside the comparator also meant re-reading a
// list that the sort was busy reordering.
const lastEntry = subclasses[subclasses.length - 1];

// Sorted by `value`, not by display text (ADR-0007): resolution to a display
// label happens at render time, after the locale is known, so this module has
// no text to sort by. `value` happens to already group entries by class in a
// sensible order (the enum was declared that way) — the render-time sort
// (`sortSelectOptions`, via `resolveOptions`) re-sorts by the resolved label
// for the consumers that need alphabetical order; this only guarantees
// "Nessuna" lands last for the ones that don't (e.g. `SelectButtonery`).
export default subclasses.sort((a, b) => {
  if (a.value === lastEntry?.value) {
    return 1;
  }
  if (b.value === lastEntry?.value) {
    return -1;
  }
  return a.value - b.value;
});
