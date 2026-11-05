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
