import pageMetaFields from "@/app/lib/config/pageMetaFields";
import pagesConfig from "@/app/lib/config/pagesConfig";
import ControlType from "@/app/lib/definitions/types/ControlType";
import PageType from "@/app/lib/definitions/types/PageType";

/**
 * Every formatted-text value in a domain's rows (SPEC-019 T5) — the fields
 * the page's metadata declares `ControlType.RichText` — for the page to
 * resolve its record links in one batch (`ResolvedRecordLinks`). Read from the
 * metadata rather than listed, so a field switched to `RichText` later is
 * resolved without touching the page.
 */
export default function richTextValuesOf(
  pageType: PageType,
  rows: readonly object[]
): (string | null)[] {
  const keys = pagesConfig[pageType].fields.filter(
    (key) => pageMetaFields[key].controlType === ControlType.RichText
  );
  return rows.flatMap((row) =>
    keys.map((key) => {
      const value: unknown = (row as Record<string, unknown>)[key];
      return typeof value === "string" ? value : null;
    })
  );
}
