import { NextRequest, NextResponse } from "next/server";

import FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
import requireApiSession from "@/app/lib/auth/requireApiSession";
import defaultRecordImageStore from "@/app/lib/storage/defaultRecordImageStore";
import { MAX_IMAGE_BYTES } from "@/app/lib/storage/imageUploadRules";
import storeRecordImage from "@/app/lib/storage/storeRecordImage";
import createRecordImage from "@/app/lib/data/recordImages/createRecordImage";

const STATUS_BY_ERROR: Partial<Record<FieldErrorKey, number>> = {
  imageRequired: 400,
  imageTooLarge: 413,
  imageUnsupportedType: 415,
  imageUndecodable: 422,
  imageStoreFailed: 500,
};

function refuse(error: FieldErrorKey) {
  return NextResponse.json(
    { error },
    { status: STATUS_BY_ERROR[error] ?? 400 }
  );
}

/**
 * POST /api/record-images
 *
 * Accepts one image (multipart field `file`) for a record, runs it through
 * the resize/strip pipeline and stores its display and thumbnail versions
 * (SPEC-020, ADR-0017), then records them as a `recordImage` row (T3).
 * Answers `201` with the row's `id` — the value the form's image field then
 * submits as the record's `imageId` — beside the `StoredRecordImage` keys
 * and display size; or an error status whose body's `error` is a
 * `FieldErrorKey`, for the form to resolve at the render boundary (ADR-0007).
 *
 * The row is created here, not when the record is saved, so the field can
 * preview the upload by id at once. An upload whose form is then abandoned
 * leaves an unowned row and its two files behind — see ADR-0017, "Orphans".
 *
 * A route handler rather than a Server Action because a Server Action's
 * request body is capped at 1 MB by default, well under SPEC-020's 10 MB —
 * the same reason map uploads use `/api/maps/upload`.
 */
export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return refuse("imageRequired");

  // Checked before the bytes are read; the pipeline checks the buffer again.
  if (file.size > MAX_IMAGE_BYTES) return refuse("imageTooLarge");

  const result = await storeRecordImage(
    Buffer.from(await file.arrayBuffer()),
    defaultRecordImageStore
  );
  if (!result.ok) return refuse(result.error);

  // Deletes both files again if the insert fails, so a refusal here leaves
  // nothing behind.
  const id = await createRecordImage(result.image, defaultRecordImageStore);
  if (id === null) return refuse("imageStoreFailed");

  return NextResponse.json({ id, ...result.image }, { status: 201 });
}
