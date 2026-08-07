/**
 * SPEC-004 T5a — proves the world tree already says everything the columns
 * T5 drops say, for every row, before T5 drops them.
 *
 *   pnpm tsx --env-file-if-exists=.env app/seed/verifyDerivedLocationsT5.ts
 *
 * Read-only: it writes nothing and changes nothing. Run it, read the
 * summary, and only run T5's migration if it reports zero mismatches.
 *
 * **Why this exists.** SPEC-004 §9 calls T5 "the point of no easy return"
 * and asks the DM to confirm the migrated tree looks right. Eyeballing 124
 * records is not a check anybody performs honestly. But T4 pinned every
 * record at exactly the place its `location` column named, so the tree and
 * the columns should agree *by construction* — which turns a judgement call
 * into an assertion. If it holds, dropping the columns is provably lossless.
 *
 * Three things are checked per record:
 *
 * 1. It has a pin at all. A record created through the form since T4 ran
 *    has a `location` value and no pin (`createNpc` writes the column and
 *    does not pin) — the one way real drift gets in.
 * 2. The pin's parent is the place `location` names.
 * 3. For deities only: the nearest `plane` above that parent is the one
 *    `residence` names. These two columns are independent today and nothing
 *    keeps them consistent, so a mismatch here may mean the *data* was
 *    always contradictory rather than that the tree is wrong — the report
 *    says which, and the DM decides.
 */
import prisma from "@/app/lib/connections/prisma";
import locationList from "@/app/lib/config/geography/locationList";
import celestialPlanes from "@/app/lib/config/geography/celestialPlanes";
import deriveEntityAncestry, {
  findAncestorOfKind,
} from "@/app/modules/maps/lib/utils/deriveEntityAncestry";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

/** `locationList`'s numeric `value` -> the title T3 seeded that place as. */
const PLACE_TITLE_BY_VALUE = new Map(
  locationList.map((entry) => [entry.value, entry.type as string])
);

/**
 * `celestialPlanes`' numeric `value` -> the title T3 seeded that plane as.
 * The catalogue holds message keys, and T3 wrote the Italian display names
 * (`geography.planes.cieli` -> "Cieli"), so the key's last segment is
 * matched case-insensitively against the title rather than resolved through
 * next-intl, which is not available outside a request.
 */
const PLANE_KEY_BY_VALUE = new Map(
  celestialPlanes.map((entry) => [
    entry.value,
    entry.labelKey.split(".").pop() ?? "",
  ])
);

const normalise = (value: string) =>
  value.toLowerCase().replaceAll(/[^a-z]/g, "");

interface Mismatch {
  recordId: number;
  name: string;
  reason: string;
}

async function verify(linkedType: LinkableEntityType) {
  const poiRows = await prisma.poi.findMany({
    select: {
      id: true,
      title: true,
      kind: true,
      parentId: true,
      linkedType: true,
      linkedId: true,
    },
  });
  const ancestry = deriveEntityAncestry(poiRows, linkedType);

  // Widened to one shape with a nullable `residence` rather than left as a
  // union: `"residence" in record` narrows the value to `unknown`, and the
  // only way back from that is an assertion this does not need.
  const records =
    linkedType === "npc"
      ? (
          await prisma.npc.findMany({
            select: { id: true, name: true, location: true },
          })
        ).map((row) => ({ ...row, residence: null }))
      : await prisma.deities.findMany({
          select: { id: true, name: true, location: true, residence: true },
        });

  const mismatches: Mismatch[] = [];

  for (const record of records) {
    const chain = ancestry.get(record.id);
    if (chain === undefined) {
      mismatches.push({
        recordId: record.id,
        name: record.name,
        reason: "no pin — created after T4's migration, never placed",
      });
      continue;
    }

    const expectedPlace = PLACE_TITLE_BY_VALUE.get(record.location);
    const derivedPlace = chain[0]?.title;
    if (expectedPlace === undefined) {
      mismatches.push({
        recordId: record.id,
        name: record.name,
        reason: `location ${record.location} is not in locationList at all`,
      });
    } else if (derivedPlace !== expectedPlace) {
      mismatches.push({
        recordId: record.id,
        name: record.name,
        reason: `place: column says "${expectedPlace}", tree says "${derivedPlace ?? "(none)"}"`,
      });
    }

    if (record.residence === null) continue;

    const expectedPlaneKey = PLANE_KEY_BY_VALUE.get(record.residence);
    const derivedPlane = findAncestorOfKind(chain, "plane")?.title;
    if (expectedPlaneKey === undefined) {
      mismatches.push({
        recordId: record.id,
        name: record.name,
        reason: `residence ${record.residence} is not in celestialPlanes at all`,
      });
    } else if (
      derivedPlane === undefined ||
      normalise(derivedPlane) !== normalise(expectedPlaneKey)
    ) {
      mismatches.push({
        recordId: record.id,
        name: record.name,
        reason:
          `plane: residence column says "${expectedPlaneKey}", ` +
          `tree says "${derivedPlane ?? "(none)"}" — check whether the two ` +
          "columns ever agreed for this row",
      });
    }
  }

  return { total: records.length, mismatches };
}

async function main() {
  let failed = false;

  for (const linkedType of ["npc", "deity"] as const) {
    const { total, mismatches } = await verify(linkedType);
    const label = linkedType === "npc" ? "NPCs" : "Deities";

    if (mismatches.length === 0) {
      console.log(
        `✅ ${label}: all ${total} reproduce their columns from the tree.`
      );
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

  console.log(
    failed
      ? "\nDo NOT run T5's migration yet — resolve the above first."
      : "\nThe tree is a complete replacement for the columns. T5 is safe to run."
  );
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((error: unknown) => {
    console.error("T5 verification failed to run:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
