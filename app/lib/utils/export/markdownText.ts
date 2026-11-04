/**
 * Escaping for text written into a Markdown export (SPEC-033), so that what
 * the DM wrote reads back as written rather than as Markdown syntax.
 *
 * A backslash before ASCII punctuation is always a valid CommonMark escape,
 * so escaping a character that would not have been read as syntax is
 * harmless; missing one that would is not. Both functions lean that way.
 */

/** Characters that mean something wherever they sit in a line. */
const INLINE_SYNTAX = /[\\`*_[\]<>~]/g;

/**
 * A line opening with these starts a heading, a list item, a quote or a
 * setext underline; a number followed by `.` or `)` starts an ordered item.
 */
const LINE_START_SYMBOL = /^(\s*)([#+=-])/;
const LINE_START_NUMBER = /^(\s*\d+)([.)])(?=\s|$)/;

/** Text placed inside a line: emphasis, code, link and HTML syntax escaped. */
export function escapeInline(text: string): string {
  return text.replace(INLINE_SYNTAX, (character) => `\\${character}`);
}

/** One line of a paragraph, kept from opening a block of its own. */
export function escapeLineStart(line: string): string {
  return line
    .replace(LINE_START_SYMBOL, "$1\\$2")
    .replace(LINE_START_NUMBER, "$1\\$2");
}

/**
 * Lines of one paragraph, each kept from opening a block and joined by hard
 * breaks: a backslash at the end of a line, CommonMark's visible form, which
 * an editor that trims trailing spaces cannot erase.
 */
export function joinParagraphLines(lines: string[]): string {
  const trimmed = lines.map((line) => line.trim());
  while (trimmed[0] === "") trimmed.shift();
  while (trimmed.at(-1) === "") trimmed.pop();
  return trimmed.map(escapeLineStart).join("\\\n");
}
