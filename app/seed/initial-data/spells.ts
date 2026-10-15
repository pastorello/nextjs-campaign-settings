// Demo data only. Every `description` and `upcast` value here is invented prose
// written for this repository (TD-154): the records keep SRD names so the
// seeded pages look like a real library, but no rulebook text — the official
// Italian translations included — is committed. See docs/domain/licensing.md §7
// rule 3, and app/seed/importLibrary.ts for the same rule applied to the DM's
// real, gitignored library.
const spells = [
  {
    name: "Aiuto",
    description:
      "<p>L’incantatore intreccia un filo di volontà condivisa fra sé e un massimo di tre compagni entro gittata. Ogni bersaglio percepisce la presenza degli altri come un peso sollevato dalle spalle: finché l’incantesimo dura, la stanchezza non ha presa su di loro e nessuno può essere separato dal gruppo dalla paura.</p>\n",
    level: 2,
    circle: [18, 19, 3, 2, 4, 20],
    classes: [1, 4],
    castingTime: "1Azione",
    range: "30",
    components: "V,S,M",
    duration: "8 ore",
    savingThrow: "Nessuno",
    ritual: false,
    concentration: true,
    upcast:
      "Impiegando uno slot di livello superiore al secondo, l’incantatore può legare al filo un compagno in più per ogni livello oltre il secondo.",
  },
  {
    name: "Bacche Benefiche",
    description:
      "<p>Dai palmi dell’incantatore germogliano piccoli frutti scuri, tiepidi al tatto e dal sapore di resina. Chi ne mangia uno sente la fame allontanarsi e le ferite più leggere chiudersi da sole. I frutti si spengono e diventano cenere al primo chiarore del mattino seguente, qualunque cura si usi per conservarli.</p>\n",
    level: 1,
    circle: [21, 8, 9],
    classes: [2, 5],
    castingTime: "1Azione",
    range: "touch",
    components: "V,S,M",
    duration: "Istantanea",
    savingThrow: "Nessuno",
    ritual: false,
    concentration: true,
    upcast: "",
  },
  {
    name: "Caduta Morbida",
    description:
      "<p>Una corrente d’aria densa si raccoglie sotto chi sta precipitando entro gittata e ne spezza la discesa in una lunga planata. Chi tocca terra mentre l’incantesimo è attivo si rialza senza un graffio, e la corrente si dissolve in un soffio tiepido appena il piede trova appoggio.</p>\n",
    level: 1,
    circle: [17, 15, 13, 6, 1, 0, 5, 7, 14, 16],
    classes: [6, 3, 0],
    castingTime: "1Reazione",
    range: "60",
    components: "V, M",
    duration: "1 minuto",
    savingThrow: "Nessuno",
    ritual: false,
    concentration: true,
    upcast: "",
  },
  {
    name: "Dardo Incantato",
    description:
      "<p>Tre schegge di luce pallida si staccano dalle dita dell’incantatore e si incurvano nell’aria fino a trovare i bersagli che egli ha scelto e può vedere. Le schegge non mancano mai il colpo, ma si consumano nell’istante in cui toccano la preda e non lasciano dietro di sé che un bagliore freddo.</p>\n",
    level: 1,
    circle: [7, 5, 17, 13, 14, 15, 16, 6],
    classes: [3, 6],
    castingTime: "1Azione",
    range: "120",
    components: "V,S",
    duration: "Istantanea",
    savingThrow: "Nessuno",
    ritual: false,
    concentration: true,
    upcast:
      "Impiegando uno slot di livello superiore al primo, si stacca dalle dita dell’incantatore una scheggia in più per ogni livello oltre il primo.",
  },
];

export default spells;
