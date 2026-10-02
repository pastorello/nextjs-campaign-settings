import type GameSystem from "@/app/lib/definitions/GameSystem";

/** The campaign rows whose fields depend on the campaign's system. */
export type CampaignRow = "adventure" | "scene" | "sceneCreature" | "loot";

/**
 * Which of a campaign row's fields belong to which game system (SPEC-030
 * §9 decision 2), declared once. Every field not listed is shared. The
 * editors show a system's own fields, and `otherSystemFieldErrors` refuses
 * a write that carries the other system's.
 */
const campaignSystemFields: Record<
  CampaignRow,
  Record<GameSystem, readonly string[]>
> = {
  adventure: {
    dnd5e: ["xpTarget", "currencyTarget", "currencyUnit"],
    daggerheart: ["goldTarget"],
  },
  scene: {
    dnd5e: ["xpAward", "grantsHeroPoint"],
    daggerheart: ["milestone", "battleAdjustments"],
  },
  sceneCreature: {
    dnd5e: ["level", "xpEach", "challengeRating"],
    daggerheart: ["dhAdversaryId"],
  },
  loot: {
    dnd5e: ["value", "magicItemId", "treasureId"],
    daggerheart: ["gold", "dhWeaponId", "dhArmorId", "dhLootId"],
  },
};

export default campaignSystemFields;
