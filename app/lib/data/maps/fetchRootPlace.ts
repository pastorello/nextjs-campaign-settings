import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type RootPlace from "../../definitions/interfaces/maps/RootPlace";

/**
 * The tree's root, or `null` on an empty installation (SPEC-004 §10 M4).
 *
 * Not `"use server"` — unlike `fetchPois`, this is only ever called from
 * `app/[locale]/dashboard/world/page.tsx`, a Server Component the proxy
 * already gates, the same reasoning `getDeitiesCount` and friends rely on.
 */
export default async function fetchRootPlace(): Promise<RootPlace | null> {
  let row;
  try {
    row = await prisma.poi.findFirst({
      where: { kind: "region", parentId: null },
      select: { id: true, title: true, mapImage: true },
    });
  } catch (error) {
    throw toDatabaseError("fetching the root place", error);
  }

  if (!row || row.mapImage === null) return null;

  return { id: row.id, title: row.title, mapImage: row.mapImage };
}
