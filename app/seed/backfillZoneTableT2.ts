/**
 * SPEC-008 T2 — backfills the new `zone` table from today's `poi` table's
 * navigable-kind rows (id-preserving), and sets `npc.zoneId`/`deities.zoneId`
 * from each entity's current pin's `parentId`.
 *
 *   pnpm tsx --env-file-if-exists=.env app/seed/backfillZoneTableT2.ts
 *
 * Purely additive and read-only against the old `poi` table — it is only
 * read here, never written or dropped; that split is T8. Idempotent: `zone`
 * rows are upserted by id (matched against the source `poi` row), and every
 * entity's `zoneId` assignment is a deterministic overwrite of the same
 * value on every run.
 */
import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/app/lib/connections/prisma";
import { NAVIGABLE_PLACE_KINDS } from "@/app/modules/maps/constants/place-kinds";

interface NavigablePoiRow {
  id: number;
  title: string;
  description: string | null;
  kind: string;
  parentId: number | null;
  lat: number | null;
  lng: number | null;
  mapImage: string | null;
  mapBounds: Prisma.JsonValue | null;
  mapInitialView: Prisma.JsonValue | null;
  mapInitialZoom: number | null;
}

async function backfillZones(): Promise<number> {
  const rows: NavigablePoiRow[] = await prisma.poi.findMany({
    where: { kind: { in: [...NAVIGABLE_PLACE_KINDS] } },
    select: {
      id: true,
      title: true,
      description: true,
      kind: true,
      parentId: true,
      lat: true,
      lng: true,
      mapImage: true,
      mapBounds: true,
      mapInitialView: true,
      mapInitialZoom: true,
    },
    orderBy: { id: "asc" },
  });

  const pending = new Map(rows.map((row) => [row.id, row]));
  const inserted = new Set<number>();

  while (pending.size > 0) {
    const ready = [...pending.values()].filter(
      (row) => row.parentId === null || inserted.has(row.parentId)
    );
    if (ready.length === 0) {
      throw new Error(
        "Cannot resolve zone parentage for poi ids " +
          `${[...pending.keys()].join(", ")} — a navigable poi row's ` +
          "parent is missing or itself non-navigable."
      );
    }

    for (const row of ready) {
      await prisma.zone.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          title: row.title,
          description: row.description,
          kind: row.kind,
          parentId: row.parentId,
          lat: row.lat,
          lng: row.lng,
          mapImage: row.mapImage,
          // `Json?` columns: Prisma rejects a plain `null` here (ambiguous
          // between "JSON null" and "SQL NULL") unless the field is simply
          // omitted, which leaves it NULL — same trick as migrateWorldTreeT3.
          ...(row.mapBounds !== null && { mapBounds: row.mapBounds }),
          ...(row.mapInitialView !== null && {
            mapInitialView: row.mapInitialView,
          }),
          mapInitialZoom: row.mapInitialZoom,
        },
        update: {},
      });
      inserted.add(row.id);
      pending.delete(row.id);
    }
  }

  // Explicit id inserts above bypass the `zone_id_seq` sequence — advance it
  // past the highest id written so the next organic `create` (T4's modal,
  // T8's migration) does not collide with a backfilled row.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('zone', 'id'), COALESCE((SELECT MAX(id) FROM zone), 1))`
  );

  return inserted.size;
}

async function backfillEntityZoneIds(): Promise<{
  npc: number;
  deities: number;
}> {
  const pins = await prisma.poi.findMany({
    where: { linkedType: { in: ["npc", "deity"] } },
    select: { linkedType: true, linkedId: true, parentId: true },
  });

  let npcCount = 0;
  let deitiesCount = 0;
  for (const pin of pins) {
    if (pin.linkedId === null || pin.parentId === null) {
      throw new Error(
        `Entity pin (linkedType ${String(pin.linkedType)}, linkedId ` +
          `${String(pin.linkedId)}) is missing linkedId or parentId — ` +
          "cannot derive a zoneId for it."
      );
    }
    if (pin.linkedType === "npc") {
      await prisma.npc.update({
        where: { id: pin.linkedId },
        data: { zoneId: pin.parentId },
      });
      npcCount++;
    } else if (pin.linkedType === "deity") {
      await prisma.deities.update({
        where: { id: pin.linkedId },
        data: { zoneId: pin.parentId },
      });
      deitiesCount++;
    }
  }

  return { npc: npcCount, deities: deitiesCount };
}

async function main() {
  console.log("Backfilling zone table from navigable poi rows...");
  const zoneCount = await backfillZones();
  console.log(`  ${zoneCount} zone rows present.`);

  console.log("Backfilling npc.zoneId/deities.zoneId from entity pins...");
  const { npc, deities } = await backfillEntityZoneIds();
  console.log(`  ${npc} npc rows, ${deities} deities rows updated.`);
}

main()
  .catch((error: unknown) => {
    console.error("T2 zone-table backfill failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
