"use server";

import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import isForeignKeyViolation from "@/app/lib/errors/isForeignKeyViolation";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** Creates a Daggerheart domain card (SPEC-021 T3). */
export default async function createDhDomainCard(
  formData: DhDomainCard
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.DhDomainCard).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Read from `parsed.data`, never the raw payload (TD-122); the schema is
  // built from a runtime field list, so this assertion narrows it back.
  const {
    name,
    domainId,
    cardLevel,
    recallCost,
    cardType,
    featureText,
    origin,
  } = parsed.data as Omit<DhDomainCard, "id" | "domain">;

  try {
    await prisma.dhDomainCard.create({
      data: {
        name,
        domainId,
        cardLevel,
        recallCost,
        cardType,
        featureText,
        origin,
      },
    });
  } catch (error) {
    // `domainId` is the payload's only foreign key, table-backed with no Zod
    // membership check — a stale id surfaces here, as a field error.
    if (isForeignKeyViolation(error)) {
      return {
        ok: false,
        errors: { domainId: [fieldError("dhDomainNotFound")] },
      };
    }
    throw toDatabaseError("creating domain card", error);
  }

  revalidateDashboard("domain-cards");
  revalidateDashboard("domains");
  return { ok: true };
}
