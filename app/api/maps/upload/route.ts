import { NextRequest, NextResponse } from "next/server";

import requireApiSession from "@/app/lib/auth/requireApiSession";
import defaultMapImageStore from "@/app/lib/storage/defaultMapImageStore";
import {
  ALLOWED_MAP_IMAGE_CONTENT_TYPES,
  MAX_MAP_IMAGE_BYTES,
} from "@/app/lib/storage/mapImageUploadRules";

/**
 * POST /api/maps/upload
 *
 * Accepts a single map image (multipart form field `file`), stores it under
 * an app-generated id (ADR-0008), and returns that id. Nothing references the
 * id yet — that wiring is M2+.
 */
export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  if (!ALLOWED_MAP_IMAGE_CONTENT_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported content type: ${file.type}` },
      { status: 415 }
    );
  }

  if (file.size > MAX_MAP_IMAGE_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const id = await defaultMapImageStore.put(data, file.type);

  return NextResponse.json({ id }, { status: 201 });
}
