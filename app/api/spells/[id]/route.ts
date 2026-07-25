import { NextResponse } from "next/server";
import requireApiSession from "@/app/lib/auth/requireApiSession";
import parseIdParam from "@/app/lib/data/validation/parseIdParam";
import { deleteSpellById } from "@/app/lib/data/spells/deleteSpellById";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const theParams = await context.params;
  const id = parseIdParam(theParams.id);
  if (id instanceof NextResponse) return id;

  const isDeleted = await deleteSpellById(id);

  if (isDeleted) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json(
      {
        success: false,
        error: "Oggetto non trovato o errore durante la cancellazione",
      },
      { status: 500 }
    );
  }
}
