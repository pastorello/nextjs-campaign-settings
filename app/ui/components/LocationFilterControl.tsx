"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import fetchZones from "@/app/lib/data/maps/fetchZones";
import fetchZoneLandmarks from "@/app/lib/data/maps/fetchZoneLandmarks";
import { UNKNOWN_ZONE_PARAM } from "@/app/lib/data/maps/buildLocationWhere";
import type ZoneOption from "@/app/lib/definitions/interfaces/maps/ZoneOption";

const ALL_OPTION = "";

/**
 * The admin list's Zone → POI filter (SPEC-008 T6/§5) — bespoke, not
 * `SortableHeader`'s built-in `PageMeta.options` filter select: the POI
 * step's options are scoped to whichever Zone is currently picked and
 * fetched async, which a static options list can't express (see
 * `ListColumn.isFiltrable`'s note on the "Location" column).
 *
 * Reads/writes `?zoneId=`/`?poiId=` directly — `zoneId=none` is the
 * "Sconosciuta" filter option (`WHERE zoneId IS NULL`), meeting SPEC-007's
 * placement-backlog need as a side effect (§5).
 */
export default function LocationFilterControl() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [landmarks, setLandmarks] = useState<ZoneOption[]>([]);

  const zoneIdParam = searchParams.get("zoneId") ?? ALL_OPTION;
  const poiIdParam = searchParams.get("poiId") ?? ALL_OPTION;
  const isRealZoneSelected =
    zoneIdParam !== ALL_OPTION && zoneIdParam !== UNKNOWN_ZONE_PARAM;

  useEffect(() => {
    fetchZones()
      .then(setZones)
      .catch(() => setZones([]));
  }, []);

  useEffect(() => {
    // A non-real zoneId hides the POI select entirely (below), so a stale
    // `landmarks` value in that state is never rendered — nothing to reset.
    if (!isRealZoneSelected) return;
    fetchZoneLandmarks(Number(zoneIdParam))
      .then(setLandmarks)
      .catch(() => setLandmarks([]));
  }, [isRealZoneSelected, zoneIdParam]);

  const setParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === ALL_OPTION) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-4 flex gap-2">
      <select
        aria-label={t("common.locationModal.zoneLabel")}
        value={zoneIdParam}
        onChange={(e) =>
          setParams({ zoneId: e.target.value || null, poiId: null })
        }
        className="rounded-md border border-gray-200 py-2 px-3 text-sm"
      >
        <option value={ALL_OPTION}>{t("common.filters.all")}</option>
        <option value={UNKNOWN_ZONE_PARAM}>
          {t("common.location.unknown")}
        </option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.title}
          </option>
        ))}
      </select>
      {isRealZoneSelected && (
        <select
          aria-label={t("common.locationModal.poiLabel")}
          value={poiIdParam}
          onChange={(e) => setParams({ poiId: e.target.value || null })}
          className="rounded-md border border-gray-200 py-2 px-3 text-sm"
        >
          <option value={ALL_OPTION}>{t("common.filters.all")}</option>
          {landmarks.map((landmark) => (
            <option key={landmark.id} value={landmark.id}>
              {landmark.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
