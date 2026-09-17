"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildCreateSchema } from "../validation/buildEntitySchema";
import { revalidatePath } from "next/cache";
import NpcItem from "../../definitions/interfaces/npc/NpcItem";
import isForeignKeyViolation from "@/app/lib/errors/isForeignKeyViolation";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function createNpc(
  formData: NpcItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildCreateSchema(PageType.Npc).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Read from `parsed.data`, never the raw payload: its values are the
  // coerced ones (TD-122). The schema is built from a runtime field list, so
  // its output type is widened; this assertion narrows it back.
  const {
    name,
    description,
    title,
    alignment,
    alignmentDomain,
    position,
    faction,
    appearance,
    personality,
    motivations,
    secrets,
  } = parsed.data as Omit<NpcItem, "id">;

  try {
    await prisma.npc.create({
      data: {
        name,
        description,
        title,
        alignment,
        alignmentDomain,
        position,
        faction,
        appearance,
        personality,
        motivations,
        secrets,
      },
    });
  } catch (error) {
    // `faction` is the only foreign key this payload writes — a table-backed
    // field with no Zod membership check (SPEC-006 §7), so a stale id only
    // surfaces here, as a field error rather than a 500.
    if (isForeignKeyViolation(error)) {
      return {
        ok: false,
        errors: { faction: ["That faction no longer exists."] },
      };
    }
    throw toDatabaseError("creating npc", error);
  }

  revalidatePath("/npc");
  return { ok: true };
}
