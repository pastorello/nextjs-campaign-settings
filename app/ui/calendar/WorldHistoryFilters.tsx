"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import WorldHistoryQuery from "@/app/lib/definitions/interfaces/calendar/WorldHistoryQuery";
import Select from "@/app/ui/forms/inputs/Select";
import { WorldHistoryLinkOptions } from "./WorldHistoryEventForm";

type FilterParam = "place" | "npc" | "deity" | "faction";

const FILTERS: {
  param: FilterParam;
  options: keyof WorldHistoryLinkOptions;
}[] = [
  { param: "place", options: "zones" },
  { param: "npc", options: "npcs" },
  { param: "deity", options: "deities" },
  { param: "faction", options: "factions" },
];

/**
 * The "any" choice: never a row id, which is always positive, and the value
 * `sortSelectOptions` keeps at the top of the list.
 */
const ANY = -1;

interface WorldHistoryFiltersProps {
  query: WorldHistoryQuery;
  linkOptions: WorldHistoryLinkOptions;
}

/**
 * Filters the world history list by linked place, NPC, deity or faction
 * (SPEC-014 §5.6). Each choice is a URL parameter, so a filtered history is
 * a link that can be kept or shared; choosing one goes back to the first
 * page, since the old page number counted a different list.
 */
export default function WorldHistoryFilters({
  query,
  linkOptions,
}: WorldHistoryFiltersProps) {
  const t = useTranslations("calendar.history.filters");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function apply(changes: Partial<Record<FilterParam, number>>) {
    const params = new URLSearchParams(searchParams);
    for (const [param, id] of Object.entries(changes)) {
      if (id === ANY) params.delete(param);
      else params.set(param, String(id));
    }
    params.delete("page");
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  }

  const isFiltered = FILTERS.some(({ param }) => query[param] !== null);

  return (
    <fieldset className="mt-4 rounded-md border border-gray-200 p-3">
      <legend className="px-1 text-sm font-medium text-gray-900">
        {t("title")}
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FILTERS.map(({ param, options }) => (
          <Select
            key={param}
            label={t(param)}
            value={query[param] ?? ANY}
            options={[{ value: ANY, label: t("any") }, ...linkOptions[options]]}
            onChange={(value) => apply({ [param]: Number(value) })}
          />
        ))}
      </div>
      {isFiltered && (
        <button
          type="button"
          className="mt-2 text-sm text-blue-600 underline"
          onClick={() =>
            apply({ place: ANY, npc: ANY, deity: ANY, faction: ANY })
          }
        >
          {t("clear")}
        </button>
      )}
    </fieldset>
  );
}
