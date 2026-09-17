import type { POIGeoJSON } from "@/app/modules/maps/types/poi";
import { poiGeoJSONSchema } from "@/app/modules/maps/types/poiSchema";

/**
 * The `.geojson` file half of "export/import places", shared by `WorldMap`
 * (via `usePOIFileIO`) and the vendored `MapMain` (TD-128). Each caller
 * keeps its own toasts; only the file handling lives here, so the two can
 * no longer drift — `WorldMap` used to skip the schema check below.
 */

/** Offers `geojson` to the browser as a `my-places-<timestamp>.geojson` download. */
export function downloadPOIGeoJSON(geojson: POIGeoJSON): void {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-places-${Date.now()}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads an uploaded file as a POI collection, validated with
 * `poiGeoJSONSchema` (TD-02b). Throws on text that is not JSON and on JSON
 * that is not a POI collection, so a malformed file fails once, here, rather
 * than deep inside `usePOIManager.importGeoJSON` or once per feature on the
 * server.
 */
export async function readPOIGeoJSONFile(file: File): Promise<POIGeoJSON> {
  const text = await file.text();
  const parsed = poiGeoJSONSchema.safeParse(JSON.parse(text));

  if (!parsed.success) {
    throw new Error(`Invalid GeoJSON: ${parsed.error.message}`);
  }

  // `id` / `createdAt` / `updatedAt` are optional in the schema —
  // importGeoJSON already fills them in when absent — but POIGeoJSON
  // declares them required, matching the app's own export.
  return parsed.data as POIGeoJSON;
}
