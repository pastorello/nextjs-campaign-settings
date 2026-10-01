import { NextResponse } from "next/server";

import apiVisibilityScope from "@/app/lib/auth/apiVisibilityScope";
import isMapImageVisible from "@/app/lib/data/visibility/isMapImageVisible";
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
  // SPEC-022 T7 (R11): a player gets a map only for a place they can see,
  // and a 404 otherwise: the map's existence is itself information.
  const scope = await apiVisibilityScope();
  if (scope instanceof NextResponse) return scope;

  const { id } = await context.params;
  if (!(await isMapImageVisible(id, scope))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const image = await defaultMapImageStore.get(id);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: { "Content-Type": image.contentType },
  });
}
