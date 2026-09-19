"use server";

import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import isForeignKeyViolation from "@/app/lib/errors/isForeignKeyViolation";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** Updates a Daggerheart domain card (SPEC-021 T3). */
export default async function updateDhDomainCard(
  formData: DhDomainCard
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.DhDomainCard).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Only the declared keys the payload carried, already coerced (TD-122).
  const { id, ...data } = parsed.data as Partial<
    Omit<DhDomainCard, "domain">
  > & { id: number };

  try {
    await prisma.dhDomainCard.update({ where: { id }, data });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return {
        ok: false,
        errors: { domainId: [fieldError("dhDomainNotFound")] },
      };
    }
    throw toDatabaseError("updating domain card", error);
  }

  revalidateDashboard("domain-cards");
  revalidateDashboard("domains");
  return { ok: true };
}
