const spells = [
  {
    name: "Aiuto",
    description:
      "<p>Questo incantesimo rafforza il vigore e la determinazione degli alleati. L’incantatore sceglie fino a tre creature entro gittata. 11 massimo dei punti ferita e i punti ferita attuali di ogni bersaglio aumentano di 5 per la durata dell’incantesimo.</p>\n",
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
      "Quando l'incantatore lancia questo incantesimo usando uno slot incantesimo di 3° livello o superiore, i punti ferita di un bersaglio aumentano di altri 5 punti per ogni slot di livello superiore al 2°.",
  },
  {
    name: "Bacche Benefiche",
    description:
      "<p>Fino a dieci bacche compaiono in mano all’incantatore e sono pervase di magia per la durata dell’incantesimo. Una creatura può usare la sua azione per mangiare una bacca. Mangiare una bacca ripristina 1 punto ferita e la bacca fornisce nutrimento sufficiente a sfamare una creatura per un giorno. Le bacche perdono il loro potere se non vengono mangiate entro 24 ore dal lancio di questo incantesimo.</p>\n",
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
      "<p>L’incantatore sceglie fino a cinque creature in caduta entro gittata. La velocità di discesa di una creatura in caduta rallenta fino a 18 metri per round finché l’incantesimo non termina. Se la creatura atterra prima che l’incantesimo termini, essa non subisce alcun danno da caduta e può atterrare in piedi, e l’incantesimo termina per quella creatura.</p>\n",
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
      "<p>L’incantatore crea tre dardi lucenti di forza magica. Ogni dardo colpisce una creatura scelta dall’incantatore, situata entro gittata e che egli sia in grado di vedere. Un dardo infligge 1d4+1 danni da forza al suo bersaglio. Tutti i dardi colpiscono simultaneamente e l’incantatore può dirigerli per colpire una sola creatura o più creature.</p>\n",
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
      "Quando l'incantatore lancia questo incantesimo usando uno slot incantesimo di 2° livello o superiore, l'incantesimo crea un dardo aggiuntivo per ogni slot di livello superiore al 1°.",
  },
];

export default spells;
