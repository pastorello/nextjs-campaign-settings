import { NextResponse } from "next/server";
import { deletePngById } from "@/app/lib/data/png/deletePngById";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const theParams = await params;
  const id = parseInt(theParams.id);
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
