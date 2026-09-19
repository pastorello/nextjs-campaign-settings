import { ElementType } from "htmlparser2";

import isRichTextHtml from "./isRichTextHtml";
import parseRichText, { RichTextNode } from "./parseRichText";

/** Elements whose end is a line break in the extracted text. */
const LINE_ENDING = new Set(["p", "li", "h3", "h4", "br"]);

function collect(nodes: RichTextNode[], out: string[]): void {
  for (const node of nodes) {
    if (node.type === ElementType.Text) {
      out.push(node.data);
    } else if (node.type === ElementType.Tag) {
      collect(node.children, out);
      if (LINE_ENDING.has(node.name)) out.push("\n");
    }
  }
}

/**
 * The words of a stored description with its markup removed (SPEC-019 T6): a
 * formatted value is sanitised, then reduced to its text, one line per
 * paragraph, list item, heading or `<br>`; entities are decoded. A legacy
 * plain-text value is returned unchanged. For matching search terms against
 * text rather than tag names.
 */
export default function richTextToPlainText(value: string): string {
  if (!isRichTextHtml(value)) return value;
  const out: string[] = [];
  collect(parseRichText(value), out);
  return out
    .join("")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
