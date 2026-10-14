import type { Prisma } from "@/generated/prisma/client";

/** What `copyAdventure` reads of the original: the adventure, whole. */
export type AdventureCopySource = Prisma.adventureGetPayload<{
  include: {
    scenes: { include: { creatures: true; loot: true } };
    calendarEvents: true;
  };
}>;

/** Where the copy lands and what it is called. */
export interface AdventureCopyTarget {
  /** `null` = a standalone adventure. */
  campaignId: number | null;
  position: number;
  title: string;
}

type AdventureData = Omit<
  Prisma.adventureUncheckedCreateInput,
  "scenes" | "calendarEvents"
>;
type SceneData = Omit<
  Prisma.sceneUncheckedCreateWithoutAdventureInput,
  "creatures" | "loot" | "calendarEvents"
>;
type CreatureData = Prisma.sceneCreatureUncheckedCreateWithoutSceneInput;
type LootData = Prisma.lootUncheckedCreateWithoutSceneInput;
type EventData = Pick<
  Prisma.calendarEventUncheckedCreateInput,
  | "title"
  | "description"
  | "startDay"
  | "startHour"
  | "endDay"
  | "endHour"
  | "repeatsYearly"
>;

/** The rows of an adventure's copy, ready to write (SPEC-032 §5.4). */
export interface AdventureCopy {
  adventure: AdventureData;
  /** In ladder order; the copy's scene ids follow the same order. */
  scenes: Array<{
    scene: SceneData;
    creatures: CreatureData[];
    loot: LootData[];
  }>;
  /**
   * The adventure's own events. `sceneIndex` is the index in `scenes` of the
   * scene the event names, or `null`: ids exist only once the scenes do, so
   * the writer repoints the link (SPEC-032 §9, _Risks_). Empty for a
   * standalone destination — an event with no campaign would be world history.
   */
  events: Array<{ event: EventData; sceneIndex: number | null }>;
}

const byPositionThenId = <T extends { position: number; id: number }>(
  a: T,
  b: T
) => a.position - b.position || a.id - b.id;

/**
 * Turns an adventure with its scenes, creatures, loot and events into the rows
 * of its copy (SPEC-032 §5.4). Pure: no reads, no writes, the input is not
 * touched.
 *
 * Copied: every authored column and every catalogue or world link. Reset:
 * `status` to `planned`, and every `awarded`, `taken` and `milestone` to
 * false. Battle Point adjustments are kept — they are part of how the fight is
 * built. Ids, timestamps and parent ids are the database's to assign.
 */
export default function buildAdventureCopy(
  source: AdventureCopySource,
  target: AdventureCopyTarget
): AdventureCopy {
  const scenes = [...source.scenes].sort(byPositionThenId);
  const sceneIndexById = new Map(scenes.map((scene, i) => [scene.id, i]));

  return {
    adventure: {
      campaignId: target.campaignId,
      position: target.position,
      title: target.title,
      targetLevel: source.targetLevel,
      synopsis: source.synopsis,
      status: "planned",
      xpTarget: source.xpTarget,
      currencyTarget: source.currencyTarget,
      currencyUnit: source.currencyUnit,
      permanentItemTarget: source.permanentItemTarget,
      consumableTarget: source.consumableTarget,
      goldTarget: source.goldTarget,
    },
    scenes: scenes.map((scene) => ({
      scene: {
        position: scene.position,
        kind: scene.kind,
        title: scene.title,
        description: scene.description,
        xpAward: scene.xpAward,
        grantsHeroPoint: scene.grantsHeroPoint,
        awarded: false,
        milestone: false,
        battleAdjustments: [...scene.battleAdjustments],
        zoneId: scene.zoneId,
      },
      creatures: [...scene.creatures].sort(byPositionThenId).map((c) => ({
        position: c.position,
        name: c.name,
        level: c.level,
        xpEach: c.xpEach,
        quantity: c.quantity,
        note: c.note,
        awarded: false,
        npcId: c.npcId,
        dhAdversaryId: c.dhAdversaryId,
        statsUrl: c.statsUrl,
        challengeRating: c.challengeRating,
      })),
      loot: [...scene.loot].sort(byPositionThenId).map((l) => ({
        position: l.position,
        description: l.description,
        quantity: l.quantity,
        value: l.value,
        taken: false,
        magicItemId: l.magicItemId,
        treasureId: l.treasureId,
        gold: l.gold,
        dhWeaponId: l.dhWeaponId,
        dhArmorId: l.dhArmorId,
        dhLootId: l.dhLootId,
      })),
    })),
    events:
      target.campaignId === null
        ? []
        : [...source.calendarEvents]
            .filter((event) => event.campaignId !== null)
            .sort((a, b) => a.id - b.id)
            .map((event) => ({
              event: {
                title: event.title,
                description: event.description,
                startDay: event.startDay,
                startHour: event.startHour,
                endDay: event.endDay,
                endHour: event.endHour,
                repeatsYearly: event.repeatsYearly,
              },
              sceneIndex:
                event.sceneId === null
                  ? null
                  : (sceneIndexById.get(event.sceneId) ?? null),
            })),
  };
}
