import { NextResponse } from "next/server";
import requireApiSession from "@/app/lib/auth/requireApiSession";
import parseIdParam from "@/app/lib/data/validation/parseIdParam";
import toErrorResponse from "@/app/lib/errors/toErrorResponse";
import { deleteFactionById } from "@/app/lib/data/faction/deleteFactionById";

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
    await deleteFactionById(id);
  } catch (error) {
    return toErrorResponse(error);
  }

  return NextResponse.json({ success: true });
}
