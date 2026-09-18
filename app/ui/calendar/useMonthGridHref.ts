"use client";

import type CalendarMonth from "@/app/lib/calendar/CalendarMonth";
import { monthGridParams } from "@/app/lib/calendar/parseMonthGridParams";
import useSearchParamsHref from "@/app/lib/hooks/useSearchParamsHref";

/**
 * The current page's href showing `target` as a month grid, keeping the
 * page's other filters and dropping the list's `page` (SPEC-014 T7). Shared
 * by the grid's navigation buttons and its PageUp/PageDown keys (T9).
 */
export default function useMonthGridHref(): (target: CalendarMonth) => string {
  const hrefWith = useSearchParamsHref();
  return (target) =>
    hrefWith({ view: "grid", ...monthGridParams(target), page: null });
}
