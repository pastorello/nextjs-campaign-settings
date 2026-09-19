import pagesConfig from "@/app/lib/config/pagesConfig";
import PageType from "@/app/lib/definitions/types/PageType";

/**
 * Whether a page exists under a game system (ADR-0013 rule 4): a shared page
 * (no `system` in `pagesConfig`) exists under every system, a catalogue page
 * only under its own. The one predicate behind the 404 (`assertPageSystem`),
 * search (rule 10), the sidebar and the overview cards, so they cannot
 * disagree about which pages a system has.
 */
export default function isPageInSystem(
  pageType: PageType,
  system: string
): boolean {
  const pageSystem = pagesConfig[pageType].system;
  return pageSystem === undefined || pageSystem === system;
}
