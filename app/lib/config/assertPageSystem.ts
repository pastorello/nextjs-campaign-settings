import { notFound } from "next/navigation";

import pagesConfig from "@/app/lib/config/pagesConfig";
import PageType from "@/app/lib/definitions/types/PageType";

/**
 * A catalogue page under a system it does not belong to is a 404 (ADR-0013
 * rule 4): `/dashboard/daggerheart/spells` is not the 5e spell list. Shared
 * pages (no `system` in `pagesConfig`) pass under every system. `system` is
 * the raw route param; `[system]/layout.tsx` has already rejected unknown
 * ones.
 */
export default function assertPageSystem(pageType: PageType, system: string) {
  const pageSystem = pagesConfig[pageType].system;
  if (pageSystem !== undefined && pageSystem !== system) notFound();
}
