const RECORD_IMAGE_ROUTE = "/api/record-images";

/**
 * A stored record image file by its storage key (SPEC-020 T4) — the
 * authenticated, same-origin `GET /api/record-images/[key]`, which needs no
 * database read. What cards and list rows point an `<img>` at.
 */
export function recordImageUrl(key: string): string {
  return `${RECORD_IMAGE_ROUTE}/${encodeURIComponent(key)}`;
}

/**
 * A stored record image by its `recordImage` id (SPEC-020 T3), for a caller
 * that holds only `imageId` — the image field's preview, a place's popover.
 * Costs a row lookup per request, so lists use `recordImageUrl` instead.
 */
export function recordImageByIdUrl(
  imageId: number,
  size: "thumb" | "display" = "thumb"
): string {
  return `${RECORD_IMAGE_ROUTE}/by-id/${imageId}?size=${size}`;
}
