import { NextResponse } from "next/server";
import requireApiSession from "@/app/lib/auth/requireApiSession";
import { deleteDeityById } from "@/app/lib/data/deities/deleteDeityById";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const theParams = await context.params;
  const id = parseInt(theParams.id);
  const isDeleted = await deleteDeityById(id);

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
