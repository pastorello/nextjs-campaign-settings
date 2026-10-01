import { NextRequest, NextResponse } from "next/server";

import prisma from "@/app/lib/connections/prisma";
import apiVisibilityScope from "@/app/lib/auth/apiVisibilityScope";
import isRecordImageVisible from "@/app/lib/data/visibility/isRecordImageVisible";
import parseIdParam from "@/app/lib/data/validation/parseIdParam";
import toErrorResponse from "@/app/lib/errors/toErrorResponse";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import defaultRecordImageStore from "@/app/lib/storage/defaultRecordImageStore";

/**
 * GET /api/record-images/by-id/[id]?size=thumb|display
 *
 * Serves a record image by its `recordImage` id rather than by storage key
 * (SPEC-020 T3). A record carries only `imageId`, so this is what lets the
 * image field preview the image a record already has — and what a list row
 * or card can point an `<img>` at without its read loading the keys. The
 * thumbnail by default, since that is what the form and lists show.
 *
 * Same access rule as `/api/record-images/[key]` (ADR-0017): session first.
 * A row's keys never change — replacing an image creates a new row with a
 * new id — so an id names immutable bytes too, and the response carries the
 * same private, year-long cache.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // SPEC-022 T7 (R12): a player gets the image of a record they can see,
  // and a 404 otherwise.
  const scope = await apiVisibilityScope();
  if (scope instanceof NextResponse) return scope;

  const id = parseIdParam((await context.params).id);
  if (id instanceof NextResponse) return id;
  try {
    if (!(await isRecordImageVisible(id, scope))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    return toErrorResponse(error);
  }

  const size = request.nextUrl.searchParams.get("size") ?? "thumb";
  if (size !== "thumb" && size !== "display") {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }

  let row;
  try {
    row = await prisma.recordImage.findUnique({
      where: { id },
      select: { displayKey: true, thumbKey: true },
    });
  } catch (error) {
    return toErrorResponse(toDatabaseError("reading a record image", error));
  }

  const image =
    row &&
    (await defaultRecordImageStore.get(
      size === "thumb" ? row.thumbKey : row.displayKey
    ));
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
