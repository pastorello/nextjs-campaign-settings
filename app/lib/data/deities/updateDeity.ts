"use server";

import checkRecordImageReference from "@/app/lib/data/recordImages/checkRecordImageReference";
import releaseReplacedRecordImage from "@/app/lib/data/recordImages/releaseReplacedRecordImage";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { buildUpdateSchema } from "../validation/buildEntitySchema";

import Deity from "../../definitions/interfaces/deities/Deity";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export default async function updateDeity(
  formData: Deity
): Promise<MutationResult> {
  await requireSession();

  const parsed = buildUpdateSchema(PageType.Deity).safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  // Written from `parsed.data`, never the raw payload: it holds only the
  // declared keys the payload carried, already coerced (TD-122). The schema is
  // built from a runtime field list, so its output type is widened; this is
  // the one assertion that narrows it back.
  const { id, ...data } = parsed.data as Partial<Omit<Deity, "image">> & {
    id: number;
  };

  const imageErrors = await checkRecordImageReference(data.imageId, {
    relation: "deity",
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
        await prisma.deities.findUnique({
          where: { id },
          select: { imageId: true },
        })
      )?.imageId;
    }
    await prisma.deities.update({
      where: { id },
      data,
    });
  } catch (error) {
    throw toDatabaseError("updating deity", error);
  }

  await releaseReplacedRecordImage(previousImageId, data.imageId);

  revalidateDashboard("deities");
  return { ok: true };
}
