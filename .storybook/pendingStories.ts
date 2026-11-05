/**
 * The story-coverage ratchet's two lists (ADR-0021). See
 * `storyCoverage.test.ts`.
 */
/**
 * Components that render no UI of their own — a context or a provider. They
 * are exercised through the stories of the components that read them, and
 * `.storybook/preview.tsx` mounts `ReadOnlyViewProvider` around every story.
 */
export const NO_UI_OF_THEIR_OWN: readonly string[] = [
  "app/modules/maps/components/providers/ThemeProviderWrapper.tsx",
  "app/modules/maps/contexts/MapContext.tsx",
  "app/modules/maps/contexts/ThemeContext.tsx",
  "app/ui/campaigns/EncounterAdjustmentsProvider.tsx",
  "app/ui/dashboard/ReadOnlyView.tsx",
  "app/ui/richText/DeletedRecordLinksContext.tsx",
  "app/ui/richText/RecordLinkContext.tsx",
  "app/ui/richText/RecordLinkTargetsProvider.tsx",
];

/**
 * TD-156: components still without a story. This list only shrinks —
 * `storyCoverage.test.ts` fails on a new component missing from both a story
 * and this list, and on an entry here that a story now covers, so the line
 * goes in the same change as the story. Grouped by the batch that will cover
 * it (docs/TECH_DEBT.md, TD-156).
 */
export const PENDING_STORIES: readonly string[] = [
];
