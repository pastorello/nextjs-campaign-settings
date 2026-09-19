import { parseDocument } from "htmlparser2";

import sanitizeRichText from "./sanitizeRichText";

/** A node of a parsed formatted-text value — element, text, or (never kept) other. */
export type RichTextNode = ReturnType<typeof parseDocument>["children"][number];

/**
 * Sanitises a stored formatted-text value, then parses it into a node tree —
 * the one entry point every reader of formatted text goes through (the
 * renderer, the record-link collector, the plain-text extractor), so none of
 * them ever walks unsanitised markup.
 */
export default function parseRichText(html: string): RichTextNode[] {
  return parseDocument(sanitizeRichText(html)).children;
}
