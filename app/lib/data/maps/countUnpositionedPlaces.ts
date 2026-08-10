import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * How many places in the whole tree have never been drawn on their parent's
 * map (SPEC-007 T2) — a tree-wide count, not scoped to the place currently
 * being viewed the way `useUnplacedChildren` (TD-71) is. The root is
 * excluded by `parentId: { not: null }`: it has no parent, so "unpositioned"
 * doesn't apply to it (SPEC-007 §5 edge cases).
 *
 * A place whose own parent has no map yet is still counted here — it is
 * still unpositioned, just for a reason the DM fixes one level up
 * (`MapUploadControl`, SPEC-007 T1), not a reason to special-case the query.
 *
 * Not `"use server"`, like `fetchRootPlace` — only ever called from
 * `geography/page.tsx`, a Server Component the proxy already gates.
 */
export default async function countUnpositionedPlaces(): Promise<number> {
  try {
    return await prisma.zone.count({
      where: { lat: null, parentId: { not: null } },
    });
  } catch (error) {
    throw toDatabaseError("counting unpositioned places", error);
  }
}
