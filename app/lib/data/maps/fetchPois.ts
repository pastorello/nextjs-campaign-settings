"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { isLinkableEntityType } from "@/app/modules/maps/constants/linkable-entities";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";
import type Poi from "../../definitions/interfaces/maps/Poi";

async function findValidIds(
  linkedType: LinkableEntityType,
  ids: number[]
): Promise<Set<number>> {
  if (ids.length === 0) return new Set();

  const rows =
    linkedType === "npc"
      ? await prisma.npc.findMany({
          where: { id: { in: ids } },
          select: { id: true },
        })
      : await prisma.deities.findMany({
          where: { id: { in: ids } },
          select: { id: true },
        });

  return new Set(rows.map((row) => row.id));
}

/**
 * All POIs (TD-14 / SPEC-002) — global to the instance, not scoped to a
 * user (SPEC-002 §2). No search params, no pagination: this is a map
 * annotation layer, not a `pagesConfig` list page.
 *
 * **Guarded, unlike the four `fetchFiltered*` readers.** Those are called
 * from Server Components, which only ever run server-side behind the
 * proxy's session gate. The geography page is `"use client"` all the way
 * down, so this read has to be reachable from the browser — which makes it
 * a Server Action, i.e. a POST endpoint with a stable id that the proxy
 * matcher does not cover. That is exactly the hole TD-01 closed for
 * mutations, and it applies to a read that exposes the DM's whole world
 * just as much. Hence `requireSession()`.
 *
 * Resolves each `linkedType`/`linkedId` pair against the table it names.
 * There is no database-level foreign key for a polymorphic reference
 * (SPEC-002 §6), so a link whose target was since deleted — or whose
 * `linkedType` is not one `LINKABLE_ENTITY_TYPES` recognises — is degraded
 * to unlinked here rather than handed to the UI as though still valid.
 */
export default async function fetchPois(): Promise<Poi[]> {
  await requireSession();

  let rows;
  try {
    rows = await prisma.poi.findMany({ orderBy: { createdAt: "asc" } });
  } catch (error) {
    throw toDatabaseError("fetching poi", error);
  }

  const npcIds: number[] = [];
  const deityIds: number[] = [];
  for (const row of rows) {
    if (row.linkedType === "npc" && row.linkedId != null) {
      npcIds.push(row.linkedId);
    }
    if (row.linkedType === "deity" && row.linkedId != null) {
      deityIds.push(row.linkedId);
    }
  }

  let validNpcIds: Set<number>;
  let validDeityIds: Set<number>;
  try {
    [validNpcIds, validDeityIds] = await Promise.all([
      findValidIds("npc", npcIds),
      findValidIds("deity", deityIds),
    ]);
  } catch (error) {
    throw toDatabaseError("resolving poi links", error);
  }

  return rows.map((row): Poi => {
    const { linkedType, linkedId } = row;
    const isValidLink =
      linkedType != null &&
      isLinkableEntityType(linkedType) &&
      linkedId != null &&
      (linkedType === "npc" ? validNpcIds : validDeityIds).has(linkedId);

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      lat: row.lat,
      lng: row.lng,
      category: row.category,
      linkedType: isValidLink ? linkedType : null,
      linkedId: isValidLink ? linkedId : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}
