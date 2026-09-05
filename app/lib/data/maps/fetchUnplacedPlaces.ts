"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { isPlaceKind } from "@/app/modules/maps/constants/place-kinds";
import type UnplacedPlace from "../../definitions/interfaces/maps/UnplacedPlace";

/**
 * Every unplaced place in the campaign (SPEC-017 T2) — one pool, shared by
 * every map, rather than the children of the map in view.
 *
 * This replaces the read `useUnplacedChildren` used to filter down from
 * `fetchPlaceChildren(parentId)`, which is what made a place parked under
 * the wrong parent unreachable from anywhere else: the list was derived
 * from the very tree edge the DM was trying to change (ADR-0012's context).
 *
 * Two tables, as everything about places has been since SPEC-008 T8: `zone`
 * rows with no coordinates and landmark `poi` rows with none. `kind` is the
 * discriminator the caller routes on — TD-102 is the bug that exists
 * without it, since the two id sequences are independent and an id alone
 * does not say which table to write to.
 *
 * "Unplaced" is `lat: null` — the same definition `countUnpositionedPlaces`
 * and TD-93's placement guard already use, deliberately not a second column
 * (ADR-0012, clause 2). The root is excluded by `parentId: { not: null }`:
 * it has no parent to be placed on, the same construction
 * `countUnpositionedPlaces` uses.
 *
 * Sorted here, once, rather than in the picker: the two groups the menu
 * renders ("Qui" / "Da altre mappe", §5) are a presentation split of one
 * ordered list, and merging two already-sorted lists in the client would
 * only have to sort again.
 */
export default async function fetchUnplacedPlaces(): Promise<UnplacedPlace[]> {
  await requireSession();

  let zoneRows, poiRows;
  try {
    [zoneRows, poiRows] = await Promise.all([
      prisma.zone.findMany({
        where: { lat: null, parentId: { not: null } },
        select: {
          id: true,
          title: true,
          kind: true,
          parentId: true,
          parent: { select: { title: true } },
        },
      }),
      prisma.poi.findMany({
        where: { lat: null },
        select: {
          id: true,
          title: true,
          zoneId: true,
          zone: { select: { title: true } },
        },
      }),
    ]);
  } catch (error) {
    throw toDatabaseError("fetching unplaced places", error);
  }

  const zones: UnplacedPlace[] = [];
  for (const row of zoneRows) {
    const { parentId, parent } = row;

    // `zone.kind` has no database-level enum, so a row read back is only a
    // `string` as far as the type system knows (`isPlaceKind`'s own note).
    // Same discard `useUnplacedChildren` made before this read existed: a
    // kind nothing recognises cannot be routed to a mutation.
    if (!isPlaceKind(row.kind)) {
      console.warn("Discarding place with an unknown kind:", row.id);
      continue;
    }

    // Unreachable given the `where` above and the `ZoneTree` foreign key,
    // but Prisma types the relation from the column, which is nullable for
    // the root. Discarded rather than asserted away: a `!` here would be
    // invisible if the two ever disagreed, and this pool is exactly where a
    // vanished place would be noticed.
    if (parentId === null || parent === null) {
      console.warn("Discarding unplaced place with no parent:", row.id);
      continue;
    }

    zones.push({
      id: row.id,
      title: row.title,
      kind: row.kind,
      parentId,
      parentTitle: parent.title,
    });
  }

  // No such guard on this half: `poi.zoneId` is `NOT NULL`, so a landmark
  // always has a zone to have come from (ADR-0010's split).
  const landmarks: UnplacedPlace[] = poiRows.map((row) => ({
    id: row.id,
    title: row.title,
    kind: "poi",
    parentId: row.zoneId,
    parentTitle: row.zone.title,
  }));

  // `localeCompare`, not `<`: the DM's titles are Italian and accented
  // letters sort wrongly by code unit. `sortSelectOptions` sets the
  // precedent.
  return [...zones, ...landmarks].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}
