import { ElementType } from "htmlparser2";

import isRichTextHtml from "./isRichTextHtml";
import parseRecordLink, { RecordLinkRef } from "./parseRecordLink";
import parseRichText, { RichTextNode } from "./parseRichText";
import recordLinkKey from "./recordLinkKey";

function walk(nodes: RichTextNode[], found: Map<string, RecordLinkRef>): void {
  for (const node of nodes) {
    if (node.type !== ElementType.Tag) continue;
    if (node.name === "a") {
      const link = parseRecordLink(node.attribs);
      if (link) found.set(recordLinkKey(link.domain, link.id), link);
    }
    walk(node.children, found);
  }
}

/**
 * Every distinct record link in a set of stored description values — what a
 * page must resolve before rendering them (SPEC-019 T2). Plain-text values,
 * `null` and `undefined` contribute nothing; formatted values are sanitised
 * first, so only links that would render are collected.
 */
export default function collectRecordLinks(
  values: readonly (string | null | undefined)[]
): RecordLinkRef[] {
  const found = new Map<string, RecordLinkRef>();
  for (const value of values) {
    if (typeof value === "string" && isRichTextHtml(value)) {
      walk(parseRichText(value), found);
    }
  }
  return [...found.values()];
}
