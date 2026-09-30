import type { Prisma } from "@/generated/prisma/client";

/**
 * SPEC-022 §5: there is always at least one active DM. True when taking the
 * account `id` away from the active DMs, by disabling, demoting or deleting
 * it, would leave none. An account that is not an active DM today takes
 * nothing away, whatever happens to it.
 *
 * Takes the transaction's client: the caller reads and writes inside one
 * serializable transaction, so two DMs demoting each other at once cannot
 * both succeed.
 */
export default async function leavesNoActiveDm(
  tx: Prisma.TransactionClient,
  id: string
): Promise<boolean> {
  const account = await tx.users.findUnique({
    where: { id },
    select: { role: true, active: true },
  });
  if (account?.role !== "dm" || !account.active) return false;

  const otherActiveDms = await tx.users.count({
    where: { role: "dm", active: true, id: { not: id } },
  });
  return otherActiveDms === 0;
}
