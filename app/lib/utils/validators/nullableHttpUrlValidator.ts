import { z } from "zod";

/** Long enough for a compendium page's address, short enough to bound a row. */
export const HTTP_URL_MAX_LENGTH = 2048;

/**
 * An optional `http`/`https` address (SPEC-031 §5.A.1). Blank — empty,
 * spaces or `null` — reads as `""`, the metadata layer's "no text"; the
 * write turns it into `null` (`blankToNull`), because the column's CHECK
 * admits only `NULL` or an `http(s)://` address. Any other scheme —
 * `javascript:`, `data:`, `ftp:` — is refused as `invalidFormat`, because
 * the value is rendered as a link's `href`.
 */
export default function nullableHttpUrlValidator() {
  return z.preprocess(
    (raw) => (raw === null ? "" : typeof raw === "string" ? raw.trim() : raw),
    z
      .union([
        z.literal(""),
        z.url({ protocol: /^https?$/ }).max(HTTP_URL_MAX_LENGTH),
      ])
      .optional()
  );
}
