import sanitizeHtml from "sanitize-html";

import parseRecordLink from "./parseRecordLink";
import {
  RECORD_DOMAIN_ATTRIBUTE,
  RECORD_ID_ATTRIBUTE,
  RICH_TEXT_TAGS,
} from "./richTextAllowlist";

/**
 * A tag name outside the allowlist: an anchor rewritten to it is discarded by
 * `sanitize-html` while its text is kept — "unwrapped".
 */
const UNWRAP = "unwrap";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...RICH_TEXT_TAGS],
  allowedAttributes: { a: [RECORD_DOMAIN_ATTRIBUTE, RECORD_ID_ATTRIBUTE] },
  // No kept attribute is a URL, so no scheme is ever allowed.
  allowedSchemes: [],
  allowedSchemesByTag: {},
  allowProtocolRelative: false,
  allowedStyles: {},
  // Drop a disallowed element but keep its text; these lose their text too.
  disallowedTagsMode: "discard",
  nonTextTags: [
    "script",
    "style",
    "textarea",
    "option",
    "noscript",
    "title",
    "template",
    "iframe",
    "object",
    "svg",
    "math",
  ],
  transformTags: {
    b: "strong",
    i: "em",
    a: (_tagName, attribs) => {
      const link = parseRecordLink(attribs);
      if (link === null) return { tagName: UNWRAP, attribs: {} };
      return {
        tagName: "a",
        attribs: {
          [RECORD_DOMAIN_ATTRIBUTE]: link.domain,
          [RECORD_ID_ATTRIBUTE]: String(link.id),
        },
      };
    },
  },
};

/**
 * Reduces an HTML fragment to formatted text's allowlist (SPEC-019, ADR-0016):
 * `p br strong em ul ol li h3 h4`, and `a` only as a record link
 * (`data-record-domain` + `data-record-id`, never `href`). Everything else is
 * stripped — `script`/`style` with their content, other elements down to their
 * text, every other attribute.
 *
 * Runs on every write (the field's validator, T5) and again on every render
 * (`renderRichText`), so a value hand-edited in the database or loaded by
 * `db:import` is never trusted.
 */
export default function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
