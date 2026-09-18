"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { serializeDisplayDateSystemCookie } from "@/app/lib/calendar/displayDateSystemCookie";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import { useRouter } from "@/i18n/navigation";

interface DateSystemToggleProps {
  /** Every date system, as `fetchDateSystems` returns them. */
  systems: readonly DateSystem[];
  /** The system dates are shown in now, resolved server-side. */
  selectedId: number;
}

/**
 * "Show dates in": the per-viewer choice of date system (SPEC-014 §5.2).
 * It stores the choice in a cookie (`displayDateSystemCookie.ts` says why
 * not `localStorage`) and refreshes, so the Server Components re-render
 * every date in the chosen system. Nothing is written to the database — the
 * world default is the DM's setting on `/world/calendar`, not this.
 */
export default function DateSystemToggle({
  systems,
  selectedId,
}: DateSystemToggleProps) {
  const t = useTranslations("calendar.toggle");
  const router = useRouter();
  const [value, setValue] = useState(selectedId);

  return (
    <select
      aria-label={t("label")}
      value={value}
      className="rounded-md border border-gray-200 py-2 px-3 text-sm"
      onChange={(event) => {
        const systemId = Number(event.target.value);
        if (!systems.some((system) => system.id === systemId)) return;
        setValue(systemId);
        try {
          document.cookie = serializeDisplayDateSystemCookie(systemId);
        } catch {
          // Cookies blocked (a sandboxed frame): the choice lasts only
          // until the refresh below re-renders with the default. Nothing to
          // report — the dates stay readable either way.
        }
        router.refresh();
      }}
    >
      {systems.map((system) => (
        <option key={system.id} value={system.id}>
          {system.name}
        </option>
      ))}
    </select>
  );
}
