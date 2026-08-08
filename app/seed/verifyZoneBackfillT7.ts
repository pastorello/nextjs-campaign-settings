/**
 * SPEC-008 T7 — proves T2's backfill was lossless before T8 drops the old
 * `poi` table's entity-pin rows (`linkedType`/`linkedId`) and navigable-kind
 * rows, the information those pins carried.
 *
 *   pnpm tsx --env-file-if-exists=.env app/seed/verifyZoneBackfillT7.ts
 *
 * Read-only: it writes nothing and changes nothing. Run it, read the
 * summary, and only run T8's migration if it reports zero mismatches — same
 * discipline as SPEC-004 T5a's verifier before T5's drop.
 *
 * **Why a mismatch here is not necessarily a bug.** Unlike T5a (which ran
 * before any write path could touch the tree/column pair it compared), T3's
 * `assignLocation` mutation can legitimately move an entity to a different
 * Zone/POI than the one its old pin implied — that is the whole point of
 * shipping T3/T4/T5. A mismatch means "this entity's zoneId no longer
 * matches its old pin," which is either drift (a bug) or a DM's deliberate
 * reassignment since T2 ran (expected, not data loss) — the report says
 * which pin/zoneId pair disagreed and leaves the call to the DM, the same
 * way T5a's verifier left the `residence`/tree disagreement to the DM.
 */
import prisma from "@/app/lib/connections/prisma";

interface Mismatch {
  linkedType: "npc" | "deity";
  recordId: number;
  name: string;
  reason: string;
}

async function verify(linkedType: "npc" | "deity"): Promise<{
  total: number;
  mismatches: Mismatch[];
}> {
  const pins = await prisma.poi.findMany({
    where: { linkedType },
    select: { linkedId: true, parentId: true },
  });
  const expectedZoneIdByRecordId = new Map(
    pins
      .filter(
        (pin): pin is { linkedId: number; parentId: number } =>
          pin.linkedId !== null && pin.parentId !== null
      )
      .map((pin) => [pin.linkedId, pin.parentId])
  );

  const records =
    linkedType === "npc"
      ? await prisma.npc.findMany({
          select: { id: true, name: true, zoneId: true },
        })
      : await prisma.deities.findMany({
          select: { id: true, name: true, zoneId: true },
        });

  const mismatches: Mismatch[] = [];
  for (const record of records) {
    const expectedZoneId = expectedZoneIdByRecordId.get(record.id);
    if (expectedZoneId === undefined) continue; // never had an old-style pin

    if (record.zoneId !== expectedZoneId) {
      mismatches.push({
        linkedType,
        recordId: record.id,
        name: record.name,
        reason:
          `zoneId is ${String(record.zoneId)}, old pin's parentId was ` +
          `${expectedZoneId} — reassigned since T2, or drift`,
      });
    }
  }

  return { total: expectedZoneIdByRecordId.size, mismatches };
}

async function main() {
  let failed = false;
  let totalChecked = 0;
  let totalMismatches = 0;

  for (const linkedType of ["npc", "deity"] as const) {
    const { total, mismatches } = await verify(linkedType);
    const label = linkedType === "npc" ? "NPCs" : "Deities";
    totalChecked += total;
    totalMismatches += mismatches.length;

    if (mismatches.length === 0) {
      console.log(`✅ ${label}: all ${total} pinned rows match their zoneId.`);
      continue;
    }

    failed = true;
    console.log(`❌ ${label}: ${mismatches.length} of ${total} do not match.`);
    for (const mismatch of mismatches) {
      console.log(
        `   #${mismatch.recordId} ${mismatch.name} — ${mismatch.reason}`
      );
    }
  }

  console.log(`\n${totalChecked - totalMismatches}/${totalChecked} lossless.`);
  console.log(
    failed
      ? "Review the mismatches above before running T8 — confirm each is a " +
          "deliberate reassignment, not drift."
      : "T2's backfill is a complete, lossless reproduction of the old " +
          "pins' zoneId. T8 is safe to run."
  );
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((error: unknown) => {
    console.error("T7 zone-backfill verification failed to run:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
