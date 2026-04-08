import { NextResponse } from "next/server";
import { deleteSpellById } from "@/app/lib/data/spells/deleteSpellById";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const theParams = await params;
  const id = parseInt(theParams.id);
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
