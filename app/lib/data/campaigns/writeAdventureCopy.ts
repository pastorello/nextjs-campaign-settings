import type { Prisma } from "@/generated/prisma/client";

import buildAdventureCopy, {
  type AdventureCopySource,
  type AdventureCopyTarget,
} from "./buildAdventureCopy";

/** The `include` that reads an adventure whole, as the builder expects it. */
export const adventureCopyInclude = {
  scenes: { include: { creatures: true, loot: true } },
  calendarEvents: true,
} satisfies Prisma.adventureInclude;

/**
 * Writes one adventure's copy inside the caller's transaction and returns the
 * new adventure's id. Shared by `copyAdventure` and `copyCampaign`
 * (SPEC-032 §5.4, §5.5): the adventure is created with its scenes, creatures
 * and loot nested, the new scene ids are read back by position, and the
 * events — which need them — are written last, pointed at the new scenes.
 * Every event goes to `target.campaignId`; a standalone target has none.
 */
export default async function writeAdventureCopy(
  tx: Prisma.TransactionClient,
  source: AdventureCopySource,
  target: AdventureCopyTarget
): Promise<number> {
  const copy = buildAdventureCopy(source, target);

  const created = await tx.adventure.create({
    data: {
      ...copy.adventure,
      scenes: {
        create: copy.scenes.map(({ scene, creatures, loot }) => ({
          ...scene,
          creatures: { create: creatures },
          loot: { create: loot },
        })),
      },
    },
    select: {
      id: true,
      // Ids follow the order the nested creates ran in.
      scenes: { select: { id: true }, orderBy: { id: "asc" } },
    },
  });

  if (copy.events.length > 0) {
    await tx.calendarEvent.createMany({
      data: copy.events.map(({ event, sceneIndex }) => ({
        ...event,
        campaignId: target.campaignId,
        adventureId: created.id,
        sceneId:
          sceneIndex === null ? null : (created.scenes[sceneIndex]?.id ?? null),
      })),
    });
  }

  return created.id;
}
