"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import LinkedRow from "@/app/lib/definitions/interfaces/calendar/LinkedRow";
import Select from "@/app/ui/forms/inputs/Select";

/**
 * The "any" choice: never a row id, which is always positive, and the value
 * `sortSelectOptions` keeps at the top of the list.
 */
const ANY = -1;

interface CampaignCalendarFiltersProps {
  /** The adventure filtered by, or `null` for all. */
  adventureId: number | null;
  adventures: LinkedRow[];
}

/**
 * Filters the campaign calendar by adventure (SPEC-014 §5.6): the choice is
 * the `?adventure=` URL parameter, so a filtered calendar is a link that
 * can be kept, the same as world history's filters.
 */
export default function CampaignCalendarFilters({
  adventureId,
  adventures,
}: CampaignCalendarFiltersProps) {
  const t = useTranslations("calendar.campaign.filters");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function apply(id: number) {
    const params = new URLSearchParams(searchParams);
    if (id === ANY) params.delete("adventure");
    else params.set("adventure", String(id));
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  }

  return (
    <div className="mt-4 max-w-sm">
      <Select
        label={t("adventure")}
        value={adventureId ?? ANY}
        options={[
          { value: ANY, label: t("any") },
          ...adventures.map(({ id, name }) => ({ value: id, label: name })),
        ]}
        onChange={(value) => apply(Number(value))}
      />
    </div>
  );
}
