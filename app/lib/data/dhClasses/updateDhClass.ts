"use server";

import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import distinctDomainsError from "./distinctDomainsError";

/**
 * Updates a class's own fields. Its features are edited inline, by their
 * own actions (ADR-0011), never through this one.
 */
export default async function updateDhClass(
  formData: DhClass
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.DhClass).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload (TD-122): only the
  // declared keys the payload carried, already coerced. The domain
  // validators refuse `null`, so a domain present here is a number.
  const { id, ...data } = parsed.data as Partial<
    Omit<DhClass, "features" | "domainAId" | "domainBId">
  > & { id: number; domainAId?: number; domainBId?: number };

  try {
    // An update carries only what changed, so a change to one domain is
    // compared with the other as stored.
    if (data.domainAId !== undefined || data.domainBId !== undefined) {
      const stored = await prisma.dhClass.findUnique({
        where: { id },
        select: { domainAId: true, domainBId: true },
      });
      const domainErrors = distinctDomainsError(
        data.domainAId ?? stored?.domainAId,
        data.domainBId ?? stored?.domainBId
      );
      if (domainErrors) return { ok: false, errors: domainErrors };
    }

    await prisma.dhClass.update({ where: { id }, data });
  } catch (error) {
    throw toDatabaseError("updating class", error);
  }

  revalidateDashboard("admin/classes");
  return { ok: true };
}
