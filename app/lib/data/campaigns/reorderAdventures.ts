"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import MutationResult from "@/app/lib/definitions/types/MutationResult";

const reorderSchema = z.object({
  campaignId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1),
});

/**
 * Rewrites every adventure's `position` on a campaign's ladder to match
 * `orderedIds`' order, 1-indexed — the bulk half of SPEC-013 §5's "explicit
 * integer position, editable" (the single-row half is `updateAdventure`).
 * One transaction, so a drag-and-drop reorder never leaves the ladder in a
 * partially-applied state.
 *
 * `orderedIds` must be exactly the campaign's current adventures, no more,
 * no fewer — caught before the transaction runs, since a stale client list
 * silently repositioning the wrong set would be worse than rejecting it.
 */
export default async function reorderAdventures(
  campaignId: number,
  orderedIds: number[]
): Promise<MutationResult> {
  await requireSession();

  const parsed = reorderSchema.safeParse({ campaignId, orderedIds });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  let existing;
  try {
    existing = await prisma.adventure.findMany({
      where: { campaignId: parsed.data.campaignId },
      select: { id: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up adventures for reordering", error);
  }

  const existingIds = new Set(existing.map((adventure) => adventure.id));
  const givenIds = parsed.data.orderedIds;
  const matchesLadder =
    givenIds.length === existingIds.size &&
    givenIds.every((id) => existingIds.has(id));

  if (!matchesLadder) {
    return {
      ok: false,
      errors: {
        orderedIds: [
          "The given adventures do not match this campaign's current ladder.",
        ],
      },
    };
  }

  try {
    await prisma.$transaction(
      givenIds.map((id, index) =>
        prisma.adventure.update({
          where: { id },
          data: { position: index + 1 },
        })
      )
    );
  } catch (error) {
    throw toDatabaseError("reordering adventures", error);
  }

  revalidatePath("/dashboard/campaign");
  return { ok: true };
}
