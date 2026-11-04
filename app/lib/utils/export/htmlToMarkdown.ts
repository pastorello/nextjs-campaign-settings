import { ElementType } from "htmlparser2";

import isRichTextHtml from "../richText/isRichTextHtml";
import parseRichText, { RichTextNode } from "../richText/parseRichText";
import { escapeInline, joinParagraphLines } from "./markdownText";

/**
 * Formatted text as Markdown (SPEC-033 T1), for the readable half of an
 * export. Walks the same sanitised tree as the renderer (`parseRichText`,
 * ADR-0016), so it only ever meets the allowlist: `p`, `br`, `strong`, `em`,
 * `ul`, `ol`, `li`, `h3`, `h4` and the record link `a`, which becomes its
 * own text — the record's name — since a Markdown file has no record to
 * point at. Anything else is reduced to its content.
 *
 * Only the readable copy loses the links: the export's structured data keeps
 * the stored HTML, which is what an import rewrites (SPEC-033 §5).
 */
export default function htmlToMarkdown(value: string): string {
  if (!isRichTextHtml(value)) return plainTextToMarkdown(value);
  return renderBlocks(parseRichText(value)).join("\n\n");
}

/**
 * A plain-text value — a legacy description written before SPEC-019, or a
 * textarea field — as Markdown: blank lines separate paragraphs, a single
 * line break stays a line break, and nothing the DM typed is read as syntax,
 * just as the app shows it (`whitespace-pre-wrap`, no markup).
 */
export function plainTextToMarkdown(value: string): string {
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) =>
      joinParagraphLines(paragraph.split(/\r?\n/).map(escapeInline))
    )
    .filter((paragraph) => paragraph !== "")
    .join("\n\n");
}

const isTag = (node: RichTextNode, ...names: string[]) =>
  node.type === ElementType.Tag && names.includes(node.name);

const BLOCK_TAGS = ["p", "h3", "h4", "ul", "ol", "li"];

/** Block nodes as Markdown blocks; a run of loose inline nodes is one paragraph. */
function renderBlocks(nodes: RichTextNode[]): string[] {
  const blocks: string[] = [];
  let inlineRun: RichTextNode[] = [];
  const flush = () => {
    blocks.push(paragraph(inlineRun));
    inlineRun = [];
  };

  for (const node of nodes) {
    if (node.type !== ElementType.Tag || !BLOCK_TAGS.includes(node.name)) {
      inlineRun.push(node);
      continue;
    }
    flush();
    switch (node.name) {
      case "p":
        blocks.push(paragraph(node.children));
        break;
      case "h3":
        blocks.push(heading("###", node.children));
        break;
      case "h4":
        blocks.push(heading("####", node.children));
        break;
      case "ul":
      case "ol":
        blocks.push(list(node.children, node.name === "ol"));
        break;
      default:
        // An `li` outside a list: its content, as blocks of their own.
        blocks.push(...renderBlocks(node.children));
    }
  }
  flush();
  return blocks.filter((block) => block !== "");
}

function paragraph(nodes: RichTextNode[]): string {
  return joinParagraphLines(inline(nodes).split("\n"));
}

function heading(marker: string, nodes: RichTextNode[]): string {
  const text = inline(nodes).replace(/\s+/g, " ").trim();
  return text === "" ? "" : `${marker} ${text}`;
}

/**
 * A list, one item per `li`: the marker on the item's first line, its other
 * lines — a nested list among them — indented to the item's content. Items
 * and their blocks are joined by single line breaks, so the list stays tight.
 */
function list(nodes: RichTextNode[], ordered: boolean): string {
  return nodes
    .filter((node) => isTag(node, "li"))
    .map((item, index) => {
      const marker = ordered ? `${index + 1}. ` : "- ";
      const indent = " ".repeat(marker.length);
      const content =
        item.type === ElementType.Tag
          ? renderBlocks(item.children).join("\n")
          : "";
      return content
        .split("\n")
        .map((line, lineIndex) =>
          lineIndex === 0 ? `${marker}${line}` : line && `${indent}${line}`
        )
        .join("\n")
        .trimEnd();
    })
    .join("\n");
}

/**
 * Inline content as Markdown text; a `<br>` is a `\n`, which `paragraph`
 * turns into a hard break. HTML whitespace collapses as a browser would.
 */
function inline(nodes: RichTextNode[]): string {
  return nodes
    .map((node): string => {
      if (node.type === ElementType.Text) {
        return escapeInline(node.data.replace(/\s+/g, " "));
      }
      if (node.type !== ElementType.Tag) return "";
      if (node.name === "br") return "\n";
      const content = inline(node.children);
      if (node.name === "strong") return emphasis("**", content);
      if (node.name === "em") return emphasis("*", content);
      return content;
    })
    .join("");
}

/**
 * Emphasis whose markers hug the text: `** bold**` is not bold in
 * CommonMark, so the whitespace an editor leaves inside moves outside.
 */
function emphasis(marker: string, content: string): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(content);
  const [, before = "", text = "", after = ""] = match ?? [];
  return text === "" ? content : `${before}${marker}${text}${marker}${after}`;
}
