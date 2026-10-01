import { NextResponse } from "next/server";
import requireApiDm from "@/app/lib/auth/requireApiDm";
import parseIdParam from "@/app/lib/data/validation/parseIdParam";
import toErrorResponse from "@/app/lib/errors/toErrorResponse";
import { deleteDhAncestryById } from "@/app/lib/data/dhAncestries/deleteDhAncestryById";

// SPEC-021 T2 — a Daggerheart domain.
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiDm();
  if (unauthorized) return unauthorized;

  const theParams = await context.params;
  const id = parseIdParam(theParams.id);
  if (id instanceof NextResponse) return id;

  try {
    await deleteDhAncestryById(id);
  } catch (error) {
    return toErrorResponse(error);
  }

  return NextResponse.json({ success: true });
}
