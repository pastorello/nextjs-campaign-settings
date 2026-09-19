import richTextToPlainText from "./richTextToPlainText";
import sanitizeRichText from "./sanitizeRichText";

/**
 * The value the formatted-text editor hands to its form (SPEC-019, ADR-0016):
 * its HTML run through the sanitiser, so nothing outside the allowlist leaves
 * the component — and an editor with no text in it (`<p></p>`, empty list
 * items) becomes `""`, exactly what an emptied textarea submits.
 *
 * The sanitiser still runs again on write (the field's validator, T5); this
 * is not the boundary, only a clean hand-off.
 */
export default function editorHtmlToRichText(html: string): string {
  const sanitized = sanitizeRichText(html);
  return richTextToPlainText(sanitized).trim() === "" ? "" : sanitized;
}
