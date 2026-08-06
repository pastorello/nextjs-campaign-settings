/**
 * SPEC-004 T4 — pins every existing NPC and deity onto the place their
 * `location` column already names, so the tree becomes queryable for "who
 * lives where" without waiting on the DM to place anyone by hand.
 *
 *   pnpm tsx --env-file-if-exists=.env app/seed/migrateEntityPinsT4.ts
 *
 * Idempotent: matched by `(linkedType, linkedId)` — the same
 * `@@unique([linkedType, linkedId])` constraint the schema itself enforces
 * — so a repeated or resumed-after-failure run does not create a second pin
 * for anyone.
 *
 * Every pin is created with null `lat`/`lng`: nobody has been placed on
 * their parent's map yet, only assigned a parent. That is deliberate, not a
 * gap this script leaves for later — SPEC-004 §6 treats "no map to be
 * positioned on" and "not yet placed" as the same null, distinguished by
 * looking at the parent, not a flag.
 *
 * **Deities use `location`, not `residence`, as the parent.** Per §6:
 * "One pin at Paradiso yields both: the place directly, the plane by
 * walking up" — `residence` is the plane `location`'s own parent already
 * is, so pinning at `residence` would put a deity one level too high and
 * make its `location` value unreachable from the tree.
 *
 * Does not touch `npc.location`/`deities.location`/`deities.residence`
 * themselves, or drop them — that is T5, once every pin here is confirmed
 * to reproduce what those columns already say.
 */
import prisma from "@/app/lib/connections/prisma";
import locationList from "@/app/lib/config/geography/locationList";

/** `locationList`'s numeric `value` -> the place title SPEC-004 T3 seeded it as. */
const TITLE_BY_LOCATION_VALUE = new Map(
  locationList.map((entry) => [entry.value, entry.type as string])
);

// Locations seeded by T3 are always one of these three kinds — never
// `plane`. That matters for one specific collision: "Terre Oniriche" is
// both a plane (one of the seven `celestialPlanes`) and a location
// (`locationList` value 8, a `region`). Without this filter, looking a
// title up by name alone could resolve to the wrong one of the two.
const LOCATION_KINDS = ["region", "city", "dungeon"];

async function findLocationPlaceId(locationValue: number): Promise<number> {
  const title = TITLE_BY_LOCATION_VALUE.get(locationValue);
  if (title === undefined) {
    throw new Error(`locationList has no entry for value ${locationValue}`);
  }

  const place = await prisma.poi.findFirst({
    where: { title, kind: { in: LOCATION_KINDS } },
    select: { id: true },
  });
  if (!place) {
    throw new Error(
      `No place titled "${title}" (location value ${locationValue}) — ` +
        "has SPEC-004 T3's migration run?"
    );
  }
  return place.id;
}

async function pinEntity(params: {
  linkedType: "npc" | "deity";
  linkedId: number;
  title: string;
  parentId: number;
}): Promise<"created" | "already-pinned"> {
  const existing = await prisma.poi.findFirst({
    where: { linkedType: params.linkedType, linkedId: params.linkedId },
    select: { id: true },
  });
  if (existing) return "already-pinned";

  await prisma.poi.create({
    data: {
      title: params.title,
      kind: params.linkedType,
      linkedType: params.linkedType,
      linkedId: params.linkedId,
      parentId: params.parentId,
    },
  });
  return "created";
}

async function main() {
  const npcs = await prisma.npc.findMany({
    select: { id: true, name: true, location: true },
  });
  const deities = await prisma.deities.findMany({
    select: { id: true, name: true, location: true },
  });

  console.log(`Pinning ${npcs.length} NPCs...`);
  let npcCreated = 0;
  for (const npc of npcs) {
    const parentId = await findLocationPlaceId(npc.location);
    const outcome = await pinEntity({
      linkedType: "npc",
      linkedId: npc.id,
      title: npc.name,
      parentId,
    });
    if (outcome === "created") npcCreated += 1;
  }

  console.log(`Pinning ${deities.length} deities...`);
  let deityCreated = 0;
  for (const deity of deities) {
    const parentId = await findLocationPlaceId(deity.location);
    const outcome = await pinEntity({
      linkedType: "deity",
      linkedId: deity.id,
      title: deity.name,
      parentId,
    });
    if (outcome === "created") deityCreated += 1;
  }

  console.log(
    `Done. NPCs: ${npcCreated} created, ${npcs.length - npcCreated} already pinned. ` +
      `Deities: ${deityCreated} created, ${deities.length - deityCreated} already pinned.`
  );
}

main()
  .catch((error: unknown) => {
    console.error("T4 entity-pin migration failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
