import prisma from "@/app/lib/connections/prisma";

interface ResolvedAssignment {
  ok: true;
  zoneId: number | null;
  poiId: number | null;
}

interface ResolveFailure {
  ok: false;
  errors: Record<string, string[] | undefined>;
}

/**
 * Confirms a structurally-valid `assignLocation` payload (SPEC-008 T3)
 * actually names an existing Zone and, if a landmark is chosen, that the
 * landmark's own implied zone agrees with the caller's `zoneId` — the one
 * invariant `assignLocationSchema` cannot check without a database read
 * (§6, ADR-0010: "the assignment mutation ... always sets zoneId :=
 * poi.zoneId in the same write when a POI is chosen").
 *
 * Reads the landmark-only `poi` shape T8 introduced (`zoneId`, no
 * `kind`/`parentId` — every remaining row is a landmark by construction).
 */
export default async function resolveLocationAssignment(
  zoneId: number | null,
  poiId: number | null
): Promise<ResolvedAssignment | ResolveFailure> {
  if (poiId !== null) {
    const poi = await prisma.poi.findUnique({
      where: { id: poiId },
      select: { zoneId: true },
    });
    if (!poi) {
      return {
        ok: false,
        errors: { poiId: ["This landmark does not exist."] },
      };
    }
    if (poi.zoneId !== zoneId) {
      return {
        ok: false,
        errors: {
          zoneId: ["This zone does not match the chosen landmark's own zone."],
        },
      };
    }
    return { ok: true, zoneId: poi.zoneId, poiId };
  }

  if (zoneId !== null) {
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      select: { id: true },
    });
    if (!zone) {
      return { ok: false, errors: { zoneId: ["This zone does not exist."] } };
    }
  }

  return { ok: true, zoneId, poiId: null };
}
