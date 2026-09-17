"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { POIGeoJSON } from "@/app/modules/maps/types/poi";
import {
  downloadPOIGeoJSON,
  readPOIGeoJSONFile,
} from "@/app/modules/maps/lib/utils/poiGeoJSONFile";

/**
 * `MapPOIPanel`'s export/import buttons for `WorldMap` — extracted from it
 * (TD-127). Takes `usePOIManager`'s own `exportGeoJSON`/`importGeoJSON`; this
 * hook only moves the collection to and from a `.geojson` file (through the
 * helpers it shares with `MapMain`, TD-128) and reports the outcome.
 */
export function usePOIFileIO({
  exportGeoJSON,
  importGeoJSON,
}: {
  exportGeoJSON: () => POIGeoJSON;
  importGeoJSON: (geojson: POIGeoJSON) => number;
}): {
  handleExport: () => void;
  handleImport: (file: File) => Promise<void>;
} {
  const t = useTranslations("geography.errors");

  const handleExport = useCallback(() => {
    downloadPOIGeoJSON(exportGeoJSON());
  }, [exportGeoJSON]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const geojson = await readPOIGeoJSONFile(file);
        const count = importGeoJSON(geojson);
        toast.success(t("importSuccess", { count }));
      } catch (error) {
        console.error("Failed to import POIs:", error);
        toast.error(t("importFailed"));
      }
    },
    [importGeoJSON, t]
  );

  return { handleExport, handleImport };
}
