import { NextResponse } from "next/server";
import requireApiSession from "@/app/lib/auth/requireApiSession";
import parseIdParam from "@/app/lib/data/validation/parseIdParam";
import toErrorResponse from "@/app/lib/errors/toErrorResponse";
import { deleteDeityById } from "@/app/lib/data/deities/deleteDeityById";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const theParams = await context.params;
  const id = parseIdParam(theParams.id);
  if (id instanceof NextResponse) return id;

  try {
    await deleteDeityById(id);
  } catch (error) {
    // A missing record is a 404, a failed query a 500 — each AppError carries
    // its own status, so the handler no longer decides (TD-13).
    return toErrorResponse(error);
  }

  return NextResponse.json({ success: true });
}
