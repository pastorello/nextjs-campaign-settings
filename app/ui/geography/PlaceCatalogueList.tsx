"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import isPageInSystem from "@/app/lib/config/isPageInSystem";
import PageType from "@/app/lib/definitions/types/PageType";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link } from "@/i18n/navigation";

/**
 * The records of one game-system catalogue linked to a place, in its
 * popover: SPEC-027 §5.6's communities. Only under a system that has the
 * catalogue: the world is shared, the catalogue is not. Each opens its
 * list filtered to its name, in card view. Renders nothing when the place
 * has none.
 */
export default function PlaceCatalogueList({
  zoneId,
  page,
  load,
  titleKey,
}: {
  zoneId: number;
  /** The catalogue: its system, and its list's route segment. */
  page: PageType;
  /** The place's records, as `{ id, name }`, cut to the reader. */
  load: (zoneId: number) => Promise<{ id: number; name: string }[]>;
  titleKey: string;
}) {
  const t = useTranslations();
  const system = useGameSystem();
  const enabled = isPageInSystem(page, system);
  const [records, setRecords] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const read = async () => {
      try {
        const rows = await load(zoneId);
        if (!cancelled) setRecords(rows);
      } catch (error) {
        console.error(`Failed to read a place's ${page}:`, error);
      }
    };
    void read();
    return () => {
      cancelled = true;
    };
  }, [enabled, load, page, zoneId]);

  if (!enabled || records.length === 0) return null;

  return (
    <section className="mb-3" aria-label={t(titleKey)}>
      <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">
        {t(titleKey)}
      </h3>
      <ul className="flex flex-wrap gap-x-2 text-sm">
        {records.map((record) => (
          <li key={record.id}>
            <Link
              href={dashboardPath(
                system,
                `/${page}?query=${encodeURIComponent(record.name)}&view=cards`
              )}
              className="text-blue-700 underline"
            >
              {record.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
