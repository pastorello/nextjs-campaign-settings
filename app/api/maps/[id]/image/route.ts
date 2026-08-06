import { NextResponse } from "next/server";

import requireApiSession from "@/app/lib/auth/requireApiSession";
import defaultMapImageStore from "@/app/lib/storage/defaultMapImageStore";

/**
 * GET /api/maps/[id]/image
 *
 * Authenticated serving route for map images (ADR-0008). `proxy.ts` excludes
 * `/api` from the auth gate, so this handler checks the session itself.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const image = await defaultMapImageStore.get(id);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: { "Content-Type": image.contentType },
  });
}
