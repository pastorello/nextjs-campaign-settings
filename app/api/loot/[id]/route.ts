import { NextResponse } from "next/server";
import requireApiDm from "@/app/lib/auth/requireApiDm";
import parseIdParam from "@/app/lib/data/validation/parseIdParam";
import toErrorResponse from "@/app/lib/errors/toErrorResponse";
import { deleteDhLootById } from "@/app/lib/data/dhLoot/deleteDhLootById";

// SPEC-029 T2 — a Daggerheart loot.
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
    await deleteDhLootById(id);
  } catch (error) {
    return toErrorResponse(error);
  }

  return NextResponse.json({ success: true });
}
