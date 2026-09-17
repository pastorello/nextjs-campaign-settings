"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { POIGeoJSON } from "@/app/modules/maps/types/poi";

/**
 * `MapPOIPanel`'s export/import buttons for `WorldMap` — extracted from it
 * (TD-127). Takes `usePOIManager`'s own `exportGeoJSON`/`importGeoJSON`; this
 * hook only moves the collection to and from a `.geojson` file and reports
 * the outcome.
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
    const geojson = exportGeoJSON();
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-places-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportGeoJSON]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const geojson = JSON.parse(text) as POIGeoJSON;
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
