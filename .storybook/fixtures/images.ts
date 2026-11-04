import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

/**
 * A record image whose keys resolve, through `recordImageUrl`, to the two
 * SVGs in `.storybook/public/api/record-images/` — Storybook serves that folder
 * where the app's authenticated image route would be (ADR-0021). The artwork
 * is drawn for this repo.
 */
export const portrait: RecordImageKeys = {
  displayKey: "story-portrait.svg",
  thumbKey: "story-portrait-thumb.svg",
  width: 600,
  height: 800,
};
