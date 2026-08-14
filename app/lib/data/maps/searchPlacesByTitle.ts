import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import isValidString from "@/app/lib/utils/validators/isValidString";
import type ZoneOption from "../../definitions/interfaces/maps/ZoneOption";

/**
 * A plain, case-insensitive `zone.title` match (SPEC-011 §7) — the sixth
 * domain in cross-entity search, deliberately outside the metadata layer.
 * Places have no `PageMeta`/`pagesConfig` entry (`ARCHITECTURE.md`: "a place
 * is a map annotation edited from a panel, not a browsable, filterable
 * catalogue page"), so this does not go through `getQuery.ts` — it mirrors
 * that function's free-text branch (`{ contains, mode: "insensitive" }`)
 * directly against `zone`, the one new query this spec adds rather than
 * reuses.
 *
 * Not `"use server"` — only ever called from `searchAllDomains`, itself only
 * called from `search/page.tsx`, a Server Component the proxy already gates
 * (the same reasoning `fetchRootPlace`/`countUnpositionedPlaces` rely on).
 *
 * `zone.title` carries no `@@index` today (§6) — a sequential scan is a
 * non-issue at this DM's tree size (tens of places), noted as a risk to
 * re-check if the tree grows by an order of magnitude, not a blocker now.
 */
export default async function searchPlacesByTitle(
  term: string
): Promise<ZoneOption[]> {
  if (!isValidString(term)) return [];

  try {
    return await prisma.zone.findMany({
      where: { title: { contains: term, mode: "insensitive" } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch (error) {
    throw toDatabaseError("searching places by title", error);
  }
}
