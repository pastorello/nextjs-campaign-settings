"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Builds a link to this page with some search parameters changed — set to
 * a value, or removed with `null` — and the rest kept, so a filter or a
 * page survives a change of view or month (SPEC-014 T7). The path is the
 * current one, locale included, as `Pagination` builds its links.
 */
export default function useSearchParamsHref(): (
  changes: Record<string, string | null>
) => string {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (changes) => {
    const params = new URLSearchParams(searchParams);
    for (const [name, value] of Object.entries(changes)) {
      if (value === null) params.delete(name);
      else params.set(name, value);
    }
    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  };
}
