/**
 * The formatted-text allowlist (SPEC-019, ADR-0016) — the one place that says
 * which elements a stored description may contain. Both the sanitiser and the
 * renderer's React walker read it, so they cannot drift apart.
 */
export const RICH_TEXT_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "h3",
  "h4",
  "a",
] as const;

export type RichTextTag = (typeof RICH_TEXT_TAGS)[number];

/** The block elements a stored value may start with — how HTML is told from legacy plain text. */
export const RICH_TEXT_BLOCK_TAGS = ["p", "ul", "ol", "h3", "h4"] as const;

/** The only attributes kept anywhere: the record link's, on `a`. */
export const RECORD_DOMAIN_ATTRIBUTE = "data-record-domain";
export const RECORD_ID_ATTRIBUTE = "data-record-id";
