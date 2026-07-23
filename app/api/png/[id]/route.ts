import { NextResponse } from "next/server";
import requireApiSession from "@/app/lib/auth/requireApiSession";
import parseIdParam from "@/app/lib/data/validation/parseIdParam";
import { deletePngById } from "@/app/lib/data/png/deletePngById";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const theParams = await context.params;
  const id = parseIdParam(theParams.id);
  if (id instanceof NextResponse) return id;

  const isDeleted = await deletePngById(id);

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
