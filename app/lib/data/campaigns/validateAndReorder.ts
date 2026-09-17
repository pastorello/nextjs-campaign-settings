import { Prisma } from "@/generated/prisma/client";

import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
import fieldError from "@/app/lib/data/validation/fieldError";

/**
 * Shared body of the four position-reorder actions (`reorderScenes`,
 * `reorderSceneCreatures`, `reorderLoot`, `reorderAdventures` — TD-125).
 * Each action still owns its own Zod schema, auth check and
 * `revalidatePath`; this is the part that was copied four times: look up
 * the parent's current rows, refuse anything that isn't exactly that set,
 * then rewrite every row's `position` to its 1-indexed slot in one
 * transaction.
 *
 * **The duplicate-id bug this replaces:** the old check was
 * `orderedIds.length === existingIds.size && orderedIds.every((id) =>
 * existingIds.has(id))`. With existing rows `{1,2,3}`, `orderedIds:
 * [1,1,2]` passed it — the lengths match (3) and every given id is a
 * member — so row 3 was silently never updated and ended up sharing a
 * position with row 1. Comparing `Set` sizes on *both* sides catches a
 * duplicate (a smaller set than its own array) as well as a mismatched
 * list, without a database-level unique index — see TD-125's Resolution
 * in `docs/TECH_DEBT.md` for why a `(parent, position)` unique index was
 * rejected as the fix.
 */
export default async function validateAndReorder({
  findExistingIds,
  buildPositionUpdate,
  orderedIds,
  mismatchMessage,
}: {
  findExistingIds: () => Promise<number[]>;
  buildPositionUpdate: (
    id: number,
    position: number
  ) => Prisma.PrismaPromise<unknown>;
  orderedIds: number[];
  /** A catalogue key, never prose (TD-124). */
  mismatchMessage: FieldErrorKey;
}): Promise<MutationResult> {
  let existingIdList;
  try {
    existingIdList = await findExistingIds();
  } catch (error) {
    throw toDatabaseError("looking up rows for reordering", error);
  }

  const existingIds = new Set(existingIdList);
  const givenIds = new Set(orderedIds);
  const matches =
    givenIds.size === orderedIds.length &&
    givenIds.size === existingIds.size &&
    orderedIds.every((id) => existingIds.has(id));

  if (!matches) {
    return { ok: false, errors: { orderedIds: [fieldError(mismatchMessage)] } };
  }

  try {
    await prisma.$transaction(
      orderedIds.map((id, index) => buildPositionUpdate(id, index + 1))
    );
  } catch (error) {
    throw toDatabaseError("reordering rows", error);
  }

  return { ok: true };
}
