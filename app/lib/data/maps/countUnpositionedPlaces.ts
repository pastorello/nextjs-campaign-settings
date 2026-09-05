import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * How many places in the whole campaign have never been drawn on a map
 * (SPEC-007 T2) — a campaign-wide count, not one scoped to the place
 * currently being viewed the way `useUnplacedChildren` (TD-71) is.
 *
 * **Both tables, since SPEC-017 T7.** This counted `zone` rows only, which
 * was true when it was written and quietly wrong after SPEC-008 T8 split
 * landmarks into `poi`: the picker this number sits beside has offered
 * unplaced landmarks ever since, because `fetchPlaceChildren` merges the
 * two tables — so the count could read "3 luoghi non ancora posizionati"
 * over a list of five rows. SPEC-007 §9's own risk note anticipated exactly
 * this shape: the predicate lives in one small function so that a change in
 * what counts as a position has one place to land.
 *
 * The root is excluded by `parentId: { not: null }` — it has no parent, so
 * "unpositioned" does not apply to it (SPEC-007 §5's edge cases). The
 * landmark half needs no such exclusion: `poi.zoneId` is `NOT NULL`, so
 * every landmark has a parent by construction (ADR-0010).
 *
 * A place whose own parent has no map yet is still counted here — it is
 * still unpositioned, just for a reason the DM fixes one level up
 * (`MapUploadControl`, SPEC-007 T1), not a reason to special-case the
 * query. TD-79 is about telling those two apart and remains open.
 *
 * Not `"use server"`, like `fetchRootPlace` — only ever called from
 * `geography/page.tsx`, a Server Component the proxy already gates.
 */
export default async function countUnpositionedPlaces(): Promise<number> {
  try {
    const [zones, landmarks] = await Promise.all([
      prisma.zone.count({ where: { lat: null, parentId: { not: null } } }),
      prisma.poi.count({ where: { lat: null } }),
    ]);
    return zones + landmarks;
  } catch (error) {
    throw toDatabaseError("counting unpositioned places", error);
  }
}
