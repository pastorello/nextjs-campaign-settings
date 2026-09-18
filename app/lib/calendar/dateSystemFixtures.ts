import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import DateSystemInput from "@/app/lib/definitions/interfaces/calendar/DateSystemInput";

/**
 * Two date systems for tests: the universal count as the migration seeds it,
 * and SPEC-014 §5.2's worked example — the human count anchored on the
 * Cataclysm in universal year 5770. The names are the DM's kind of content,
 * which is why they are Italian here and never pass through a catalogue.
 */
export const universalCountFixture: DateSystem = {
  id: 1,
  isUniversal: true,
  isDefault: true,
  name: "Calendario universale",
  anchorEvent: null,
  anchorYear: 0,
  afterLabel: "dall'alba dei tempi",
  afterAbbrev: "a.T.",
  beforeLabel: null,
  beforeAbbrev: null,
  monthNames: [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ],
  weekdayNames: [
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
    "Domenica",
  ],
};

export const humanCountFixture: DateSystem = {
  id: 2,
  isUniversal: false,
  isDefault: false,
  name: "Calendario umano",
  anchorEvent: "Cataclisma",
  anchorYear: 5770,
  afterLabel: "Dopo Cataclisma",
  afterAbbrev: "d.C.",
  beforeLabel: "Avanti Cataclisma",
  beforeAbbrev: "a.C.",
  monthNames: [
    "Brumaio",
    "Nevoso",
    "Piovoso",
    "Ventoso",
    "Germinale",
    "Fiorile",
    "Pratile",
    "Messidoro",
    "Termidoro",
    "Fruttidoro",
    "Vendemmiaio",
    "Frimaio",
  ],
  weekdayNames: [
    "Primo",
    "Secondo",
    "Terzo",
    "Quarto",
    "Quinto",
    "Sesto",
    "Settimo",
  ],
};

/**
 * `humanCountFixture` as the date systems panel submits it (SPEC-014 T3):
 * no id, no flags, every label a string.
 */
export const humanCountInputFixture: DateSystemInput = {
  name: "Calendario umano",
  anchorEvent: "Cataclisma",
  anchorYear: 5770,
  afterLabel: "Dopo Cataclisma",
  afterAbbrev: "d.C.",
  beforeLabel: "Avanti Cataclisma",
  beforeAbbrev: "a.C.",
  monthNames: [...humanCountFixture.monthNames],
  weekdayNames: [...humanCountFixture.weekdayNames],
};
