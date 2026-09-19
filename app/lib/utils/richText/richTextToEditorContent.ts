import isRichTextHtml from "./isRichTextHtml";
import plainTextToRichText from "./plainTextToRichText";
import sanitizeRichText from "./sanitizeRichText";

/**
 * What the formatted-text editor opens with for a stored value (SPEC-019
 * §5.5): formatted text is sanitised again — the editor trusts the database no
 * more than the renderer does — and a legacy plain-text row becomes one
 * paragraph per line. Nothing is written back until the DM saves.
 *
 * `unlink` holds the `recordLinkKey`s of records the page knows are deleted:
 * those links open as plain text (§5 edge cases), and are saved that way.
 */
export default function richTextToEditorContent(
  value: string,
  unlink?: ReadonlySet<string>
): string {
  return isRichTextHtml(value)
    ? sanitizeRichText(value, unlink)
    : plainTextToRichText(value);
}
