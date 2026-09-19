import { z } from "zod";

import editorHtmlToRichText from "@/app/lib/utils/richText/editorHtmlToRichText";
import isRichTextHtml from "@/app/lib/utils/richText/isRichTextHtml";

/**
 * Zod schema for a formatted-text field (SPEC-019 §7, ADR-0016): a string
 * whose formatted value is **sanitised on the way through**, so non-negotiable
 * rule 2 — validate before writing — is where sanitising happens, whatever
 * sent the value (the editor, `db:import`, a hand-crafted request).
 *
 * - Formatted text (it opens with `p`/`ul`/`ol`/`h3`/`h4`) is reduced to the
 *   allowlist; one with no text left in it becomes `""`, what an emptied
 *   textarea sends.
 * - Legacy plain text passes unchanged: sanitising it would escape `&` and
 *   `<` into entities the plain-text renderer would then show literally. It
 *   is rendered as escaped text, never as markup.
 *
 * Compose the field's own rules after it (`.pipe(z.string().min(1))`) so they
 * judge the sanitised value, and wrap it (`.optional()`,
 * `nullableToOptional`) as the column requires.
 */
export default function richTextValidator() {
  return z
    .string()
    .transform((value) =>
      isRichTextHtml(value) ? editorHtmlToRichText(value) : value
    );
}
