import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";

import recordLinkMark from "./recordLinkMark";

/**
 * The formatted-text editor's schema (SPEC-019, ADR-0016): StarterKit trimmed
 * to the allowlist — paragraphs, hard breaks, bold, italic, bulleted and
 * numbered lists, headings at levels 3 and 4 only, undo/redo — plus the
 * record-link mark. Everything else StarterKit ships is switched off, so the
 * editor's own schema already drops disallowed content on paste (an `h1`
 * arrives as a paragraph, a `<table>` or `<img>` as its text or nothing). The
 * sanitiser is still the boundary; this only keeps the editor honest.
 *
 * `trailingNode` is off too: it appends an empty paragraph after a closing
 * heading or list, which would be saved as noise.
 */
export default function richTextExtensions(placeholder = ""): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [3, 4] },
      blockquote: false,
      code: false,
      codeBlock: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      link: false,
      trailingNode: false,
    }),
    recordLinkMark,
    Placeholder.configure({ placeholder }),
  ];
}
