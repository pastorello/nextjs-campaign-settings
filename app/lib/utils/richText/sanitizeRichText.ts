import sanitizeHtml from "sanitize-html";

import parseRecordLink from "./parseRecordLink";
import recordLinkKey from "./recordLinkKey";
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

const NO_UNLINK: ReadonlySet<string> = new Set();

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
    a: (_tagName, attribs) => transformAnchor(attribs, NO_UNLINK),
  },
};

/**
 * An anchor is kept only as a valid record link whose `recordLinkKey` is not
 * in `unlink`; anything else is unwrapped to its text.
 */
function transformAnchor(
  attribs: sanitizeHtml.Attributes,
  unlink: ReadonlySet<string>
): sanitizeHtml.Tag {
  const link = parseRecordLink(attribs);
  if (link === null || unlink.has(recordLinkKey(link.domain, link.id))) {
    return { tagName: UNWRAP, attribs: {} };
  }
  return {
    tagName: "a",
    attribs: {
      [RECORD_DOMAIN_ATTRIBUTE]: link.domain,
      [RECORD_ID_ATTRIBUTE]: String(link.id),
    },
  };
}

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
 *
 * `unlink` (`recordLinkKey`s) also unwraps those record links — the editor
 * passes the page's deleted targets, so a link to a deleted record opens
 * unlinked (SPEC-019 §5 edge cases, T5).
 */
export default function sanitizeRichText(
  html: string,
  unlink: ReadonlySet<string> = NO_UNLINK
): string {
  if (unlink.size === 0) return sanitizeHtml(html, OPTIONS);
  return sanitizeHtml(html, {
    ...OPTIONS,
    transformTags: {
      ...OPTIONS.transformTags,
      a: (_tagName, attribs) => transformAnchor(attribs, unlink),
    },
  });
}
