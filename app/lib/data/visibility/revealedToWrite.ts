import prisma from "@/app/lib/connections/prisma";
import { activeCampaigns } from "@/app/lib/data/campaigns/activeCampaigns";

/**
 * The Prisma write for a record's reveals (SPEC-022 T6). On create, connect
 * the given campaigns. Absent ids write nothing, so an update that does not
 * touch the field leaves the reveals as they are.
 */
export function revealedToCreate(ids: number[] | undefined) {
  return ids && ids.length > 0
    ? { revealedTo: { connect: ids.map((id) => ({ id })) } }
    : {};
}

/**
 * The update: the record ends up revealed to `ids` among the campaigns the
 * form could list — the active ones — and to every archived campaign it was
 * already revealed to, untouched (SPEC-032 §9, _Risks_). Replacing the whole
 * relation (`set`) would delete the rows of a campaign the picker hides,
 * and restoring the campaign would find it blind with nothing erroring; so
 * this connects the listed ids and disconnects only the active campaigns
 * left out of them.
 */
export async function revealedToUpdate(ids: number[] | undefined) {
  if (ids === undefined) return {};

  const active = await prisma.campaign.findMany({
    where: activeCampaigns,
    select: { id: true },
  });
  const kept = new Set(ids);
  return {
    revealedTo: {
      connect: ids.map((id) => ({ id })),
      disconnect: active
        .filter(({ id }) => !kept.has(id))
        .map(({ id }) => ({ id })),
    },
  };
}
