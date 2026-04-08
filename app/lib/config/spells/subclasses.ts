import TipoTradizione from "@/app/lib/definitions/enums/deities/TipoTradizione";
import Sottoclasse from "@/app/lib/definitions/enums/spells/SottoClasse";

interface SottoClasseObject {
  type: Sottoclasse;
  value: number;
  label: string;
  titolo: string;
  tradizione: TipoTradizione;
}

const subclasses: SottoClasseObject[] = [
  {
    type: Sottoclasse.BardoSapienza,
    value: Sottoclasse.BardoSapienza,
    label: "Bardo - Collegio della Sapienza",
    titolo: "Occultista",
    tradizione: TipoTradizione.Occulta,
  },
  {
    type: Sottoclasse.BardoValore,
    value: Sottoclasse.BardoValore,
    label: "Bardo - Collegio del Valore",
    titolo: "Cantore",
    tradizione: TipoTradizione.Occulta,
  },
  {
    type: Sottoclasse.CavaliereNero,
    value: Sottoclasse.CavaliereNero,
    label: "Paladino - Cavaliere Nero",
    titolo: "Cavaliere Nero",
    tradizione: TipoTradizione.Divina,
  },
  {
    type: Sottoclasse.CavaliereBianco,
    value: Sottoclasse.CavaliereBianco,
    label: "Paladino - Cavaliere Bianco",
    titolo: "Cavaliere Bianco",
    tradizione: TipoTradizione.Divina,
  },
  {
    type: Sottoclasse.CavaliereVerde,
    value: Sottoclasse.CavaliereVerde,
    label: "Paladino - Cavaliere Verde",
    titolo: "Cavaliere Verde",
    tradizione: TipoTradizione.Divina,
  },
  {
    type: Sottoclasse.ElementaristaFuoco,
    value: Sottoclasse.ElementaristaFuoco,
    label: "Stregone - Magia del Vulcano",
    titolo: "Stregone del Fuoco",
    tradizione: TipoTradizione.Arcana,
  },
  {
    type: Sottoclasse.ElementaristaAcqua,
    value: Sottoclasse.ElementaristaAcqua,
    label: "Stregone - Magia delle Tempeste",
    titolo: "Stregone delle Tempeste",
    tradizione: TipoTradizione.Arcana,
  },
  {
    type: Sottoclasse.Fattucchiere,
    value: Sottoclasse.Fattucchiere,
    label: "Stregone - Magia Selvaggia",
    titolo: "Fattucchiere",
    tradizione: TipoTradizione.Arcana,
  },
  {
    type: Sottoclasse.DruidoTerra,
    value: Sottoclasse.DruidoTerra,
    label: "Druido - Circolo della Terra",
    titolo: "Druido dei Boschi",
    tradizione: TipoTradizione.Primeva,
  },
  {
    type: Sottoclasse.DruidoLuna,
    value: Sottoclasse.DruidoLuna,
    label: "Druido - Circolo della Luna",
    titolo: "Druido Lunare",
    tradizione: TipoTradizione.Primeva,
  },
  {
    type: Sottoclasse.WarlockFatato,
    value: Sottoclasse.WarlockFatato,
    label: "Warlock - Patrono Fatato",
    titolo: "Warlock Fatato",
    tradizione: TipoTradizione.Occulta,
  },
  {
    type: Sottoclasse.WarlockAntico,
    value: Sottoclasse.WarlockAntico,
    label: "Warlock - Patrono Grande Antico",
    titolo: "Warlock delle Ombre",
    tradizione: TipoTradizione.Occulta,
  },
  {
    type: Sottoclasse.WarlockImmondo,
    value: Sottoclasse.WarlockImmondo,
    label: "Warlock - Patrono Immondo",
    titolo: "Warlock Infernale",
    tradizione: TipoTradizione.Occulta,
  },
  {
    type: Sottoclasse.Strega,
    value: Sottoclasse.Strega,
    label: "Mago - Ammaliatore",
    titolo: "Mago Nero",
    tradizione: TipoTradizione.Arcana,
  },
  {
    type: Sottoclasse.MaestroRune,
    value: Sottoclasse.MaestroRune,
    label: "Mago - Abiuratore",
    titolo: "Maestro delle Rune",
    tradizione: TipoTradizione.Arcana,
  },
  {
    type: Sottoclasse.Oracolo,
    value: Sottoclasse.Oracolo,
    label: "Mago - Divinatore",
    titolo: "Oracolo",
    tradizione: TipoTradizione.Arcana,
  },
  {
    type: Sottoclasse.MagoBianco,
    value: Sottoclasse.MagoBianco,
    label: "Mago - Trasmutatore",
    titolo: "Mago Bianco",
    tradizione: TipoTradizione.Arcana,
  },
  {
    type: Sottoclasse.Necromante,
    value: Sottoclasse.Necromante,
    label: "Mago - Necromante",
    titolo: "Necromante",
    tradizione: TipoTradizione.Arcana,
  },
  {
    type: Sottoclasse.ChiericoMorte,
    value: Sottoclasse.ChiericoMorte,
    label: "Chierico - Dominio della Sapienza",
    titolo: "Custode delle Tombe",
    tradizione: TipoTradizione.Divina,
  },
  {
    type: Sottoclasse.ChiericoOscuro,
    value: Sottoclasse.ChiericoOscuro,
    label: "Chierico - Dominio dell'Inaganno",
    titolo: "Chierico Oscuro",
    tradizione: TipoTradizione.Divina,
  },
  {
    type: Sottoclasse.ChiericoVita,
    value: Sottoclasse.ChiericoVita,
    label: "Chierico - Dominio della Luce",
    titolo: "Custode della Fiamma",
    tradizione: TipoTradizione.Divina,
  },
  {
    type: Sottoclasse.Ranger,
    value: Sottoclasse.Ranger,
    label: "Ranger",
    titolo: "Custode dei Boschi",
    tradizione: TipoTradizione.Primeva,
  },
  {
    type: Sottoclasse.Nessuna,
    value: Sottoclasse.Nessuna,
    label: "Nessuna",
    titolo: "Nessun titolo",
    tradizione: TipoTradizione.Ultraterrena,
  },
];

export default subclasses.sort((a, b) => {
  if (a.value === subclasses[subclasses.length - 1].value) {
    return 1;
  }
  if (b.value === subclasses[subclasses.length - 1].value) {
    return -1;
  }
  return a.label.localeCompare(b.label);
});
