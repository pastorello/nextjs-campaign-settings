// Demo data only. Every `description` value here is invented prose written for
// this repository (TD-154): the records keep SRD names so the seeded pages look
// like a real library, but no rulebook text — the official Italian translations
// included — is committed. See docs/domain/licensing.md §7 rule 3, and
// app/seed/importLibrary.ts for the same rule applied to the DM's real,
// gitignored library.
const magicitems = [
  {
    name: "Anello di Rigenerazione",
    description:
      "<p>Chi porta questo anello al dito sente un calore costante risalire il braccio: le ferite si chiudono da sole, lentamente, e la fatica di una giornata di marcia si scioglie nel giro di una notte. L’anello non riporta indietro chi è già morto, e si raffredda del tutto quando il portatore perde conoscenza.</p>\n",
    rarity: 3,
    type: 0,
    attuned: true,
    consumable: false,
  },
  {
    name: "Bacchetta dei Segreti",
    description:
      "<p>Stringendo questa bacchetta e pronunciandone la parola di comando, la punta si scalda e devia come un ramo da rabdomante verso il più vicino meccanismo nascosto. La bacchetta tace davanti alle porte semplicemente chiuse a chiave, e si limita a tremare quando il passaggio che ha trovato è sorvegliato.</p>\n",
    rarity: 1,
    type: 3,
    attuned: false,
    consumable: false,
  },
  {
    name: "Cintura della Forza dei Giganti",
    description:
      "<p>Chi allaccia questa cintura sente le spalle allargarsi e i tendini irrigidirsi come funi bagnate: il vigore del portatore diventa quello della stirpe gigantesca a cui la cintura è intonata, e nessun allenamento può portarlo oltre quel limite finché la indossa.</p>\n<p>Le cinture conosciute sono sei, una per ciascuna delle stirpi che gli artigiani antichi riuscirono a imitare. Due di esse si somigliano nell’effetto pur essendo lavorate in metalli diversi, e i collezionisti le confondono con regolarità.</p>\n<p>Stirpe\tVigore\tFattura<br />\nGuardiano delle brughiere (Rara): Vigore 21<br />\nScalpellino di pietra e di gelo (Molto rara): Vigore 23<br />\nFonditore di fuoco (Molto rara): Vigore 25<br />\nPastore di nubi (Leggendaria): Vigore 27<br />\nAraldo delle tempeste (Leggendaria): Vigore 29\t</p>\n",
    rarity: 6,
    type: 5,
    attuned: true,
    consumable: false,
  },
  {
    name: "Difensiva",
    description:
      "<p>Quest’arma porta incisa sulla guardia una spirale che si chiude su se stessa. Chi la impugna può scegliere, nell’istante in cui attacca, di trattenere parte dello slancio del colpo e lasciare che la lama si frapponga fra sé e i nemici: il colpo perde mordente e in cambio la guardia si fa più stretta. La scelta vale fino al principio del turno seguente e cade subito se l’arma lascia la mano.</p>\n",
    rarity: 4,
    type: 1,
    attuned: true,
    consumable: false,
  },
];

export default magicitems;
