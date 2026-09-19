import { createElement, ReactNode } from "react";
import { ElementType } from "htmlparser2";

import RecordLink from "@/app/ui/richText/RecordLink";
import parseRecordLink from "./parseRecordLink";
import parseRichText, { RichTextNode } from "./parseRichText";
import { RichTextTag } from "./richTextAllowlist";

/**
 * The second allowlist (ADR-0016): the only elements the renderer can create,
 * each with its fixed classes — Tailwind's preflight strips list markers and
 * heading sizes, so they are restored here. `a` is absent on purpose: it
 * becomes a `RecordLink`, or nothing.
 */
const ELEMENTS: Record<Exclude<RichTextTag, "a">, string | undefined> = {
  p: undefined,
  br: undefined,
  strong: "font-semibold",
  em: "italic",
  ul: "list-disc pl-5",
  ol: "list-decimal pl-5",
  li: undefined,
  h3: "text-base font-semibold",
  h4: "text-sm font-semibold",
};

const isElementTag = (name: string): name is keyof typeof ELEMENTS =>
  Object.hasOwn(ELEMENTS, name);

function toReact(nodes: RichTextNode[]): ReactNode[] {
  return nodes.map((node, index): ReactNode => {
    if (node.type === ElementType.Text) return node.data;
    if (node.type !== ElementType.Tag) return null;

    const children = toReact(node.children);
    if (node.name === "a") {
      const link = parseRecordLink(node.attribs);
      if (link === null) return children;
      return (
        <RecordLink key={index} domain={link.domain} id={link.id}>
          {children}
        </RecordLink>
      );
    }
    if (!isElementTag(node.name)) return children;
    if (node.name === "br") return <br key={index} />;
    return createElement(
      node.name,
      { key: index, className: ELEMENTS[node.name] },
      ...children
    );
  });
}

/**
 * A stored formatted-text value as React elements (SPEC-019 T2): sanitised
 * again (`parseRichText`), parsed, then rebuilt element by element from the
 * allowlist above. No HTML string ever reaches the DOM — text nodes are React
 * text, so React escapes them — and `dangerouslySetInnerHTML` is not used.
 */
export default function richTextToReact(html: string): ReactNode[] {
  return toReact(parseRichText(html));
}
