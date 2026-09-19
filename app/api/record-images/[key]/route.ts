import { NextResponse } from "next/server";

import requireApiSession from "@/app/lib/auth/requireApiSession";
import defaultRecordImageStore from "@/app/lib/storage/defaultRecordImageStore";

/**
 * GET /api/record-images/[key]
 *
 * Authenticated serving route for record images (ADR-0017, reusing
 * ADR-0008's access rule): `proxy.ts` excludes `/api` from the auth gate, so
 * this handler checks the session itself. `key` is a storage key — a
 * display or thumbnail key from a `StoredRecordImage` — so the route needs
 * no database.
 *
 * A key names immutable bytes: replacing an image stores new files under
 * new keys. The response can therefore be cached for a year, but only by
 * the browser (`private`), never by a shared cache that would serve it
 * without a session.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> }
) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const { key } = await context.params;
  const image = await defaultRecordImageStore.get(key);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
