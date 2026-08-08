"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Every zone id in the subtree rooted at `zoneId`, including `zoneId`
 * itself (SPEC-008 T6/§5) — "everyone in Skreebars" means Skreebars and
 * everything nested under it, not just an exact match. Takes the whole
 * `zone` table in one shot rather than one query per level (§6's edge
 * case: "not one query per level") — the same in-memory-walk approach
 * `deriveEntityAncestry` already uses for the upward walk, just downward.
 */
export default async function fetchZoneDescendantIds(
  zoneId: number
): Promise<number[]> {
  await requireSession();

  let zones: { id: number; parentId: number | null }[];
  try {
    zones = await prisma.zone.findMany({
      select: { id: true, parentId: true },
    });
  } catch (error) {
    throw toDatabaseError("fetching zone tree", error);
  }

  const childrenByParent = new Map<number, number[]>();
  for (const zone of zones) {
    if (zone.parentId === null) continue;
    const siblings = childrenByParent.get(zone.parentId) ?? [];
    siblings.push(zone.id);
    childrenByParent.set(zone.parentId, siblings);
  }

  const result: number[] = [];
  // Bounded by `seen` rather than by trusting the data — same defensive
  // reasoning as `deriveEntityAncestry`'s upward walk: the mutation
  // boundary rejects a cycle, but Postgres's self-referencing FK does not.
  const seen = new Set<number>();
  const stack = [zoneId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || seen.has(current)) continue;
    seen.add(current);
    result.push(current);
    stack.push(...(childrenByParent.get(current) ?? []));
  }

  return result;
}
