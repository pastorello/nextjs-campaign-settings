import type { ArchivedCampaign } from "@/app/lib/data/campaigns/fetchArchivedCampaigns";
import type { AdventureSceneProgress } from "@/app/lib/data/campaigns/fetchAdventureSceneProgress";
import type { BudgetTotals } from "@/app/lib/data/campaigns/getBudgetTotals";
import type { CampaignCard } from "@/app/lib/data/campaigns/fetchCampaigns";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";
import type { SceneWithDetails } from "@/app/lib/data/campaigns/fetchAdventureWithScenes";
import type { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";
import type Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import type Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";
import type CampaignPlayers from "@/app/lib/definitions/interfaces/campaign/CampaignPlayers";
import type { CopyDestination } from "@/app/ui/campaigns/CopyAdventureDialog";

/** Story fixtures; invented prose (CLAUDE.md, 2026-10-15). */
export const campaign: Campaign = {
  id: 1,
  title: "La caduta di Kang",
  synopsis: "<p>Un regno che si sgretola, una mappa che nessuno finisce.</p>",
  partySize: 4,
  system: "dnd5e",
};

export const campaignCards: CampaignCard[] = [
  {
    id: 1,
    title: "La caduta di Kang",
    synopsis: "<p>Un regno che si sgretola.</p>",
    partySize: 4,
    adventureCount: 3,
  },
  {
    id: 2,
    title: "Le Lanterne di Skreebar",
    synopsis: null,
    partySize: 5,
    adventureCount: 0,
  },
];

export const archivedCampaigns: ArchivedCampaign[] = [
  {
    id: 7,
    title: "Il Concilio dei Sette",
    archivedAt: new Date("2026-09-12T10:00:00Z"),
  },
];

export const adventure: Adventure = {
  id: 5,
  campaignId: 1,
  position: 1,
  targetLevel: 4,
  title: "Il Passo Spezzato",
  synopsis: "<p>Un valico, un ponte di corda e troppe promesse.</p>",
  status: AdventureStatus.Active,
  xpTarget: 3000,
  currencyTarget: 5000,
  currencyUnit: "silver",
  permanentItemTarget: 2,
  consumableTarget: 4,
};

export const adventures: Adventure[] = [
  adventure,
  {
    ...adventure,
    id: 6,
    position: 2,
    title: "La Torre Sommersa",
    status: AdventureStatus.Planned,
    synopsis: null,
  },
  {
    ...adventure,
    id: 8,
    position: 3,
    title: "Il Faro Spento",
    status: AdventureStatus.Completed,
    synopsis: null,
  },
];

export const progress: Record<number, AdventureSceneProgress> = {
  5: { total: 4, awarded: 2 },
  6: { total: 0, awarded: 0 },
  8: { total: 3, awarded: 3 },
};

export const copyDestinations: CopyDestination[] = [
  { id: 2, title: "Le Lanterne di Skreebar" },
];

export const budgetTotals: BudgetTotals = {
  xp: { assigned: 1800, found: 900 },
  currency: { assigned: 2500, found: 1000 },
  gold: { assigned: 0, found: 0 },
  permanentItems: { assigned: 1, found: 0 },
  consumables: { assigned: 3, found: 2 },
  heroPoints: 0,
  milestones: { planned: 0, reached: 0 },
};

export const players: CampaignPlayers = {
  members: [
    { id: "u1", name: "Giulia", email: "giulia@example.test", active: true },
  ],
  candidates: [{ id: "u2", name: "Matteo" }],
};

const stamp = new Date("2026-10-01T09:00:00Z");

export const fightScene: SceneWithDetails = {
  id: 20,
  adventureId: 5,
  position: 1,
  kind: SceneKind.Fight,
  title: "L'imboscata al ponte",
  description: "<p>Tre predoni calano da una parete di roccia.</p>",
  xpAward: 450,
  grantsHeroPoint: false,
  awarded: false,
  zoneId: 4,
  createdAt: stamp,
  updatedAt: stamp,
  creatures: [
    {
      id: 30,
      sceneId: 20,
      position: 1,
      name: "Predone del passo",
      level: null,
      xpEach: 50,
      quantity: 3,
      note: "Armati di balestre",
      awarded: false,
      npcId: null,
      statsUrl: "https://example.test/predone",
    },
    {
      id: 31,
      sceneId: 20,
      position: 2,
      name: "Aldric Valmonte",
      level: 3,
      xpEach: null,
      quantity: 1,
      note: null,
      awarded: false,
      npcId: 1,
    },
  ],
  loot: [
    {
      id: 40,
      sceneId: 20,
      position: 1,
      description: "Una borsa di monete smussate",
      quantity: 1,
      value: 500,
      taken: false,
      magicItemId: null,
      treasureId: null,
    },
    {
      id: 41,
      sceneId: 20,
      position: 2,
      description: "Bussola del Cartografo",
      quantity: 1,
      value: null,
      taken: true,
      magicItemId: 3,
      treasureId: null,
    },
  ],
};

export const exploreScene: SceneWithDetails = {
  ...fightScene,
  id: 21,
  position: 2,
  kind: SceneKind.Explore,
  title: "La galleria dei venti",
  description: null,
  xpAward: null,
  awarded: true,
  zoneId: null,
  creatures: [],
  loot: [],
};

export const scenes: SceneWithDetails[] = [fightScene, exploreScene];

export const zoneOptions: ResolvedOption<number>[] = [
  { label: "Skreebar", value: 4 },
];
export const npcOptions: ResolvedOption<number>[] = [
  { label: "Aldric Valmonte", value: 1 },
];
export const magicItemOptions: ResolvedOption<number>[] = [
  { label: "Bussola del Cartografo", value: 3 },
];
export const treasureOptions: ResolvedOption<number>[] = [
  { label: "Calice d'argento", value: 6 },
];
