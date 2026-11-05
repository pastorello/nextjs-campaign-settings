import type DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";
import type DhAdversaryExperience from "@/app/lib/definitions/interfaces/daggerheart/DhAdversaryExperience";
import type DhAdversaryFeature from "@/app/lib/definitions/interfaces/daggerheart/DhAdversaryFeature";
import type DhAncestry from "@/app/lib/definitions/interfaces/daggerheart/DhAncestry";
import type DhArmor from "@/app/lib/definitions/interfaces/daggerheart/DhArmor";
import type DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import type DhClassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhClassFeature";
import type DhClassPage from "@/app/lib/definitions/interfaces/daggerheart/DhClassPage";
import type DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";
import type DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import type DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import type DhDomainCardDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCardDomain";
import type DhEnvironment from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironment";
import type DhEnvironmentFeature from "@/app/lib/definitions/interfaces/daggerheart/DhEnvironmentFeature";
import type DhLoot from "@/app/lib/definitions/interfaces/daggerheart/DhLoot";
import type DhSubclass from "@/app/lib/definitions/interfaces/daggerheart/DhSubclass";
import type DhSubclassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhSubclassFeature";
import type DhWeapon from "@/app/lib/definitions/interfaces/daggerheart/DhWeapon";
import type OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";

import { dashboardPath } from "../../i18n/dashboardPath";
import { portrait } from "./images";

/**
 * Daggerheart story fixtures. Every name and every line of prose is invented
 * for this repo: the public repository holds rules structure, never rules
 * content (CLAUDE.md, 2026-09-11).
 */

// Domains ------------------------------------------------------------------

export const emberDomain: DhDomain = {
  id: 1,
  name: "Brace",
  description: "<p>Il dominio di chi custodisce il fuoco della soglia.</p>",
  colour: "amber",
  origin: "homebrew",
  image: portrait,
};

export const tideDomain: DhDomain = {
  id: 2,
  name: "Marea",
  description: "<p>Il dominio di chi legge i porti prima dell'alba.</p>",
  colour: "sky",
  origin: "homebrew",
  image: null,
};

export const domains: DhDomain[] = [emberDomain, tideDomain];

export const emberCardDomain: DhDomainCardDomain = {
  id: 1,
  name: "Brace",
  colour: "amber",
  image: portrait,
};

export const tideCardDomain: DhDomainCardDomain = {
  id: 2,
  name: "Marea",
  colour: "sky",
  image: null,
};

// Domain cards -------------------------------------------------------------

export const lanternCard: DhDomainCard & { domain: DhDomainCardDomain } = {
  id: 1,
  name: "Lanterna del Guardiano",
  domainId: 1,
  cardLevel: 1,
  recallCost: 1,
  cardType: "ability",
  featureText: "<p>Una luce calda segue chi la porta fino al mattino.</p>",
  origin: "homebrew",
  domain: emberCardDomain,
};

export const tideCard: DhDomainCard & { domain: DhDomainCardDomain } = {
  id: 2,
  name: "Canto del Porto",
  domainId: 2,
  cardLevel: 1,
  recallCost: 0,
  cardType: "spell",
  featureText: "<p>Le onde ripetono ciò che hai sussurrato.</p>",
  origin: "homebrew",
  domain: tideCardDomain,
};

export const sparkCard: DhDomainCard & { domain: DhDomainCardDomain } = {
  id: 3,
  name: "Scintilla Ostinata",
  domainId: 1,
  cardLevel: 3,
  recallCost: 2,
  cardType: "grimoire",
  featureText: "<p>Un tizzone che rifiuta di spegnersi.</p>",
  origin: "homebrew",
  domain: emberCardDomain,
};

export const domainCards = [lanternCard, tideCard, sparkCard];

// Adversaries --------------------------------------------------------------

export const wraithExperiences: DhAdversaryExperience[] = [
  { id: 1, adversaryId: 1, position: 1, name: "Vecchie dimore", bonus: 2 },
  {
    id: 2,
    adversaryId: 1,
    position: 2,
    name: "Sussurri nel camino",
    bonus: -1,
  },
];

export const wraithFeatures: DhAdversaryFeature[] = [
  {
    id: 1,
    adversaryId: 1,
    position: 1,
    kind: "reaction",
    fear: true,
    name: "Fiamma Spenta",
    text: "<p>Si riaccende quando viene colpito.</p>",
  },
  {
    id: 2,
    adversaryId: 1,
    position: 2,
    kind: "passive",
    fear: false,
    name: "Senza Peso",
    text: "<p>Non lascia orme.</p>",
  },
];

export const lanternWraith: DhAdversary = {
  id: 1,
  name: "Spettro della Lanterna",
  description: "<p>Una luce fredda che cammina.</p>",
  tier: 2,
  adversaryType: "skulk",
  hordeDensity: null,
  motives: "<p>Attirare, svuotare, svanire.</p>",
  difficulty: 13,
  majorThreshold: 8,
  severeThreshold: 15,
  hp: 5,
  stress: 3,
  attackModifier: -1,
  attackName: "Tocco gelido",
  attackRange: "melee",
  attackDamage: "2d6+2",
  attackType: "magic",
  origin: "homebrew",
  image: portrait,
  experiences: wraithExperiences,
  features: wraithFeatures,
};

export const reefCrab: DhAdversary = {
  id: 2,
  name: "Granchio della Scogliera",
  description: null,
  tier: 1,
  adversaryType: "horde",
  hordeDensity: 3,
  motives: null,
  difficulty: 10,
  majorThreshold: null,
  severeThreshold: null,
  hp: 4,
  stress: 2,
  attackModifier: 1,
  attackName: "Chela",
  attackRange: "melee",
  attackDamage: "1d8",
  attackType: "physical",
  origin: "homebrew",
  image: null,
  experiences: [],
  features: [],
};

export const adversaries: DhAdversary[] = [lanternWraith, reefCrab];

// Ancestries and communities -----------------------------------------------

export const saltborn: DhAncestry = {
  id: 1,
  name: "Nati dal Sale",
  description: "<p>Gente di costa dalla pelle butterata.</p>",
  ancestryFeatureAName: "Orecchio di Conchiglia",
  ancestryFeatureAText: "<p>Senti il mare anche lontano da esso.</p>",
  ancestryFeatureBName: "Passo Sicuro",
  ancestryFeatureBText: "<p>Il ponte che oscilla non ti turba.</p>",
  origin: "homebrew",
  image: portrait,
};

export const hillfolk: DhAncestry = {
  ...saltborn,
  id: 2,
  name: "Gente dei Colli",
  ancestryFeatureAName: "Polmoni d'Altura",
  ancestryFeatureBName: "Memoria dei Sentieri",
  image: null,
};

export const ancestries: DhAncestry[] = [saltborn, hillfolk];

export const harborCommunity: DhCommunity = {
  id: 1,
  name: "Comunità del Porto",
  description: "<p>Chi vive tra moli e magazzini.</p>",
  adjectives: "Rumorosa, solidale, diffidente",
  communityFeatureName: "Debito d'Onda",
  communityFeatureText: "<p>Un favore reso al molo torna sempre indietro.</p>",
  communityPlaceIds: [3],
  communityFactionIds: [1],
  origin: "homebrew",
  places: [{ id: 3, name: "Molo dei Sospiri" }],
  factions: [{ id: 1, name: "Gilda dei Cartografi" }],
  image: portrait,
};

export const quietCommunity: DhCommunity = {
  ...harborCommunity,
  id: 2,
  name: "Comunità del Colle",
  adjectives: null,
  communityPlaceIds: [],
  communityFactionIds: [],
  places: [],
  factions: [],
  image: null,
};

export const communities: DhCommunity[] = [harborCommunity, quietCommunity];

// Equipment ----------------------------------------------------------------

export const wardenArmor: DhArmor = {
  id: 1,
  name: "Giaco del Custode",
  tier: 2,
  armorMajor: 7,
  armorSevere: 14,
  armorScore: 4,
  armorFeatureName: "Placca Tiepida",
  armorFeatureText: "<p>Il metallo non è mai freddo.</p>",
  origin: "homebrew",
  image: portrait,
};

export const plainArmor: DhArmor = {
  ...wardenArmor,
  id: 2,
  name: "Gambesone Rattoppato",
  tier: 1,
  armorFeatureName: null,
  armorFeatureText: null,
  image: null,
};

export const armors: DhArmor[] = [wardenArmor, plainArmor];

export const harpoon: DhWeapon = {
  id: 1,
  name: "Arpione Salmastro",
  tier: 2,
  weaponSlot: "primary",
  weaponTrait: "strength",
  weaponRange: "close",
  damageDie: 8,
  damageBonus: 2,
  weaponDamageType: "physical",
  burden: 2,
  weaponFeatureName: "Ancora la Preda",
  weaponFeatureText: "<p>Il bersaglio non può allontanarsi.</p>",
  origin: "homebrew",
  image: portrait,
};

export const buckler: DhWeapon = {
  ...harpoon,
  id: 2,
  name: "Brocchiere Liso",
  tier: 1,
  weaponSlot: "secondary",
  weaponTrait: "agility",
  weaponRange: "melee",
  damageDie: 6,
  damageBonus: 0,
  burden: 1,
  weaponFeatureName: null,
  weaponFeatureText: null,
  image: null,
};

export const weapons: DhWeapon[] = [harpoon, buckler];

export const emberTonic: DhLoot = {
  id: 1,
  name: "Tonico di Brace",
  lootKind: "consumable",
  lootRarity: "uncommon",
  rollValue: 7,
  effectText: "<p>Scalda dall'interno per una notte intera.</p>",
  origin: "homebrew",
  image: portrait,
};

export const driftwoodCharm: DhLoot = {
  ...emberTonic,
  id: 2,
  name: "Talismano di Legno Alla Deriva",
  lootKind: "item",
  lootRarity: "rare",
  rollValue: null,
  image: null,
};

export const loot: DhLoot[] = [emberTonic, driftwoodCharm];

// Environments -------------------------------------------------------------

export const fogFeatures: DhEnvironmentFeature[] = [
  {
    id: 1,
    environmentId: 1,
    position: 1,
    kind: "passive",
    name: "Nebbia Fitta",
    text: "<p>Nessuno vede oltre un braccio.</p>",
    questions: "<p>Chi ha già smarrito qualcuno qui?</p>",
  },
  {
    id: 2,
    environmentId: 1,
    position: 2,
    kind: "action",
    name: "Campana Lontana",
    text: "<p>Un rintocco attira i curiosi.</p>",
    questions: null,
  },
];

export const fogHarbour: DhEnvironment = {
  id: 1,
  name: "Porto nella Nebbia",
  description: "<p>Un molo che non finisce mai.</p>",
  tier: 2,
  environmentType: "exploration",
  impulses: "Confondere, isolare, ingannare",
  difficulty: 14,
  otherAdversaries: "Qualche mozzo spaventato",
  origin: "homebrew",
  environmentAdversaryIds: [1],
  environmentPlaceIds: [3],
  image: portrait,
  adversaries: [{ id: 1, name: "Spettro della Lanterna" }],
  places: [{ id: 3, name: "Molo dei Sospiri" }],
  features: fogFeatures,
};

export const bareEnvironment: DhEnvironment = {
  ...fogHarbour,
  id: 2,
  name: "Radura Silenziosa",
  description: null,
  impulses: null,
  otherAdversaries: null,
  environmentType: "social",
  image: null,
  adversaries: [],
  places: [],
  features: [],
};

export const environments: DhEnvironment[] = [fogHarbour, bareEnvironment];

// Classes and subclasses ---------------------------------------------------

export const wardenFeatures: DhClassFeature[] = [
  {
    id: 11,
    classId: 1,
    position: 1,
    name: "Veglia Lunga",
    text: "<p>Resti sveglio quando gli altri crollano.</p>",
  },
  {
    id: 12,
    classId: 1,
    position: 2,
    name: "Ultima Luce",
    text: "<p>Accendi un fuoco dove non dovrebbe esserci.</p>",
  },
];

export const warden: DhClass = {
  id: 1,
  name: "Custode",
  description: "<p>Chi sorveglia la soglia tra la luce e il buio.</p>",
  domainAId: 1,
  domainBId: 2,
  startingEvasion: 10,
  startingHp: 7,
  classItems: "<p>Una lanterna e una corda sottile.</p>",
  hopeFeatureName: "Fiamma Condivisa",
  hopeFeatureText: "<p>Presta la tua luce a un alleato vicino.</p>",
  origin: "homebrew",
  features: wardenFeatures,
};

export const drifter: DhClass = {
  ...warden,
  id: 2,
  name: "Vagabondo",
  description: null,
  domainAId: 2,
  domainBId: null,
  classItems: null,
  features: [],
};

export const classes: DhClass[] = [warden, drifter];

export const vigilFeatures: DhSubclassFeature[] = [
  {
    id: 21,
    subclassId: 1,
    tier: DhSubclassFeatureTier.Foundation,
    position: 1,
    name: "Sentinella",
    text: "<p>Segnali il pericolo prima che arrivi.</p>",
  },
  {
    id: 22,
    subclassId: 1,
    tier: DhSubclassFeatureTier.Foundation,
    position: 2,
    name: "Occhio Attento",
    text: "<p>Nulla ti sfugge al primo sguardo.</p>",
  },
  {
    id: 23,
    subclassId: 1,
    tier: DhSubclassFeatureTier.Mastery,
    position: 1,
    name: "Faro Vivente",
    text: "<p>La tua presenza guida chi si è perso.</p>",
  },
];

export const vigil: DhSubclass & { features: DhSubclassFeature[] } = {
  id: 1,
  classId: 1,
  name: "Via della Veglia",
  description: "<p>Chi sceglie di non dormire mai.</p>",
  spellcastTrait: "instinct",
  origin: "homebrew",
  features: vigilFeatures,
};

export const warderClassPage: DhClassPage = {
  dhClass: { ...warden, features: wardenFeatures },
  domains: [emberCardDomain, tideCardDomain],
  subclasses: [vigil],
  cards: domainCards,
};

/** The related-record options the Daggerheart forms offer. */
export const dhOptions: OptionBundle = {
  dhDomain: [
    { label: "Brace", value: 1 },
    { label: "Marea", value: 2 },
  ],
  dhClass: [{ label: "Custode", value: 1 }],
  dhAdversary: [{ label: "Spettro della Lanterna", value: 1 }],
  zone: [{ label: "Molo dei Sospiri", value: 3 }],
  faction: [{ label: "Gilda dei Cartografi", value: 1 }],
};

/**
 * `parameters.nextjs` for a Daggerheart page: the preview defaults to the
 * 5e dashboard, and the system comes from the route's `[system]` segment.
 * `view: "cards"` switches a catalogue list from rows to cards.
 */
export function dhPage(
  path: "" | `/${string}`,
  query: Record<string, string> = {}
) {
  return {
    navigation: {
      pathname: dashboardPath("daggerheart", path),
      query,
      segments: [["system", "daggerheart"]] as [string, string][],
    },
  };
}
