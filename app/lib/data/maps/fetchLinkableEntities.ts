"use server";

import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

export interface LinkableEntityOption {
  id: number;
  name: string;
}

/**
 * The id/name pairs `MapPOIPanel`'s entity selector offers for a given
 * `LinkableEntityType` (TD-14 / SPEC-002) — the panel switches on `npc`
 * versus `deity` the same way `fetchPois`'s link resolution does.
 *
 * A Server Action, not a Server Component prop: the geography page is
 * `"use client"` throughout, so the panel has to ask for this list itself
 * once a link type is chosen — hence `requireDm()`, for the same
 * reason `fetchPois` needs it.
 */
export default async function fetchLinkableEntities(
  type: LinkableEntityType
): Promise<LinkableEntityOption[]> {
  await requireDm();

  try {
    return type === "npc"
      ? await prisma.npc.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : await prisma.deities.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
  } catch (error) {
    throw toDatabaseError(`fetching linkable ${type} options`, error);
  }
}
