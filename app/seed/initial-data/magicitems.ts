const magicitems = [
  {
    id: 463,
    nome: "Anello di Rigenerazione",
    descrizione:
      "<p>Mentre indossi questo anello, recuperi 1d6 punti ferita ogni 10 minuti, purché ti rimanga almeno 1 punto ferita. Se perdi una parte del corpo, l’anello fa sì che la parte mancante ricresca e ritorni alla sua completa funzionalità in 1d6 + 1 giorni, purché per tutto il periodo ti rimanga sempre almeno 1 punto ferita.</p>\n",
    rarita: 3,
    tipo: 0,
    sintonia: true,
  },
  {
    id: 488,
    nome: "Bacchetta dei Segreti",
    descrizione:
      "<p>Mentre impugni questa bacchetta, puoi usare un’azione per spendere 1 carica, e se una porta segreta o trappola si trova entro 9 metri da te, la bacchetta pulsa e punta a quella più vicina a te. La bacchetta ha 3 cariche. La bacchetta recupera 1d3 cariche spese all’alba di ciascun giorno.</p>\n",
    rarita: 1,
    tipo: 3,
    sintonia: false,
  },
  {
    id: 462,
    nome: "Cintura della Forza dei Giganti",
    descrizione:
      "<p>Finché il personaggio indossa questa cintura, il suo punteggio di Forza cambia in un determinato punteggio conferito dalla cintura. Se il punteggio di Forza del personaggio senza cintura è pari o superiore a quello conferito dalla cintura, l’oggetto non ha alcun effetto.</p>\n<p>Esistono sei varietà di questa cintura, corrispondenti per tipo e rarità ai sei tipi di giganti puri esistenti. La cintura della forza dei giganti delle pietre e la cintura della forza dei giganti del gelo sono diverse nell’aspetto, ma hanno lo stesso effetto.</p>\n<p>Tipo\tForza\tRarità<br />\nGigante delle colline (Raro): Forza 21<br />\nGigante delle pietra/del gelo (Molto raro): Forza 23<br />\nGigante del fuoco (Molto raro): Forza\t25<br />\nGigante delle nuvole (Leggendario) Forza 27<br />\nGigante delle tempeste (Leggendario) Forza 29\t</p>\n",
    rarita: 6,
    tipo: 5,
    sintonia: true,
  },
  {
    id: 458,
    nome: "Difensiva",
    descrizione:
      "<p>Il personaggio ottiene un bonus di +3 ai tiri per colpire e ai tiri per i danni effettuati con quest’arma magica. La prima volta in ogni suo turno in cui attacca con quest’arma, il personaggio può trasferire tutto il bonus dell’arma o una qualsiasi parte di esso alla propria Classe Armatura, anziché usarlo negli attacchi effettuati in quel turno. Potrebbe, per esempio, ridurre il bonus ai tiri per colpire e ai tiri per i danni a +1 e ottenere un bonus di +2 alla CA. I bonus modificati restano in vigore fino all’inizio del turno successivo del personaggio, che deve però impugnare l’arma per ottenere il bonus alla CA.</p>\n",
    rarita: 4,
    tipo: 1,
    sintonia: true,
  },
];

export default magicitems;
