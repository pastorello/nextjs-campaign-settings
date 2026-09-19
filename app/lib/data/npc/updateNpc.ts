"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import NpcItem from "../../definitions/interfaces/npc/NpcItem";
import isForeignKeyViolation from "@/app/lib/errors/isForeignKeyViolation";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function updateNpc(
  formData: NpcItem
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Npc).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Omit<NpcItem, "image">> & {
    id: number;
  };

  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "npc",
    id,
  });
  if (imageErrors) return { ok: false, errors: imageErrors };

  // The image this save replaces or removes, when the payload touches the
  // field at all — deleted only once the update has committed, so a failed
  // save keeps the record's previous image (SPEC-020 §5).
  let previousImageId: number | null | undefined;
  try {
    if (data.imageId !== undefined) {
      previousImageId = (
        await prisma.npc.findUnique({
          where: { id },
          select: { imageId: true },
        })
      )?.imageId;
    }
    await prisma.npc.update({
      where: { id },
      data,
    });
  } catch (error) {
    // See createNpc — the same stale-faction-id case, reached on an edit
    // rather than a create.
    if (isForeignKeyViolation(error)) {
      return {
        ok: false,
        errors: { faction: [fieldError("factionNotFound")] },
      };
    }
    throw toDatabaseError("updating npc", error);
  }

  await releaseReplacedRecordImage(previousImageId, data.imageId);

  revalidateDashboard("npc");
  return { ok: true };
}
