import { RICH_TEXT_BLOCK_TAGS } from "./richTextAllowlist";

const OPENS_WITH_BLOCK = new RegExp(
  `^\\s*<(${RICH_TEXT_BLOCK_TAGS.join("|")})(\\s[^>]*)?>`,
  "i"
);

/**
 * Whether a stored description is formatted text (HTML) rather than a legacy
 * plain-text row (ADR-0016): HTML when its first non-blank characters open one
 * of the block elements the editor always starts with (`p`, `ul`, `ol`, `h3`,
 * `h4`). Everything written before SPEC-019 is plain text and is rendered as
 * it always was.
 */
export default function isRichTextHtml(value: string): boolean {
  return OPENS_WITH_BLOCK.test(value);
}
