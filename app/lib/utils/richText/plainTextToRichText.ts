const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);

/**
 * Turns a legacy plain-text description into formatted text (SPEC-019 §5.5):
 * one paragraph per line, text escaped. Empty text stays empty. For the editor
 * opening a plain-text row (T3); nothing rewrites stored rows.
 */
export default function plainTextToRichText(text: string): string {
  if (text === "") return "";
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}
