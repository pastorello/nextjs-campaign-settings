import type RecordLinkTargets from "./RecordLinkTargets";

/**
 * What a page knows about the record links in the formatted text it shows
 * (SPEC-019 T5): `targets` for the renderer, and `deleted` — the
 * `recordLinkKey`s of links in the route's game system whose record no longer
 * exists — for the editor, which opens those links unlinked (§5 edge cases).
 *
 * A link outside the system is in neither: it renders as text but is never
 * unlinked, since its record may well exist under another system.
 */
interface RecordLinkResolution {
  targets: RecordLinkTargets;
  deleted: readonly string[];
}

export default RecordLinkResolution;
