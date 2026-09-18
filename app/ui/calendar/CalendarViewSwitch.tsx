"use client";

import Link from "next/link";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import type { CalendarView } from "@/app/lib/calendar/parseMonthGridParams";
import useSearchParamsHref from "@/app/lib/hooks/useSearchParamsHref";

const VIEWS: CalendarView[] = ["list", "grid"];

/**
 * Switches a calendar page between its chronological list and its month
 * grid (SPEC-014 §5.6, T7). The view is the `?view=` URL parameter — the
 * list when absent — so it survives a reload and keeps the page's filters.
 */
export default function CalendarViewSwitch({ view }: { view: CalendarView }) {
  const t = useTranslations("calendar.grid");
  const hrefWith = useSearchParamsHref();

  return (
    <nav aria-label={t("viewLabel")} className="mt-4 flex gap-1">
      {VIEWS.map((option) => {
        const isCurrent = option === view;
        return (
          <Link
            key={option}
            href={hrefWith({
              view: option === "grid" ? "grid" : null,
            })}
            aria-current={isCurrent ? "page" : undefined}
            className={clsx(
              "rounded-md border px-3 py-1 text-sm",
              isCurrent
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
            )}
          >
            {t(option === "grid" ? "month" : "list")}
          </Link>
        );
      })}
    </nav>
  );
}
