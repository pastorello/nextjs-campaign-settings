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
  // app/modules/maps/components
  "app/modules/maps/components/map/LeafletGeoJSON.tsx",
  "app/modules/maps/components/map/LeafletMap.tsx",
  "app/modules/maps/components/map/LeafletMarker.tsx",
  "app/modules/maps/components/map/LeafletTileLayer.tsx",
  "app/modules/maps/components/map/MapContextMenu.tsx",
  "app/modules/maps/components/map/MapControls.tsx",
  "app/modules/maps/components/map/MapDetailsPanel.tsx",
  "app/modules/maps/components/map/MapErrorBoundary.tsx",
  "app/modules/maps/components/map/MapLoadingSpinner.tsx",
  "app/modules/maps/components/map/MapMain.tsx",
  "app/modules/maps/components/map/MapPOIPanel.tsx",
  "app/modules/maps/components/map/MapSearchBar.tsx",
  "app/modules/maps/components/map/MapThemeSwitcher.tsx",
  "app/modules/maps/components/map/MapTileSwitcher.tsx",
  "app/modules/maps/components/map/MapTopBar.tsx",
  "app/modules/maps/components/map/MapUser.tsx",
  "app/modules/maps/components/ui/drawer.tsx",
  "app/modules/maps/components/ui/dropdown-menu.tsx",
  "app/modules/maps/components/ui/sonner.tsx",
  // app/ui/accounts
  "app/ui/accounts/AccountRowActions.tsx",
  "app/ui/accounts/AccountsTable.tsx",
  "app/ui/accounts/NewAccountForm.tsx",
  "app/ui/accounts/OwnAccountForms.tsx",
  "app/ui/accounts/SignUpForm.tsx",
  // app/ui/buttons
  "app/ui/buttons/AssignLocationButton.tsx",
  "app/ui/buttons/ModalButton.tsx",
  "app/ui/buttons/ResetSearchButton.tsx",
  // app/ui/components
  "app/ui/components/AssignLocationModal.tsx",
  "app/ui/components/EntityLibrary.tsx",
  "app/ui/components/EntityList.tsx",
  "app/ui/components/LocationFilterControl.tsx",
  // app/ui/containers
  "app/ui/containers/ListPage.tsx",
  // app/ui/dashboard
  "app/ui/dashboard/cards.tsx",
  // app/ui/forms
  "app/ui/forms/EntityForm.tsx",
  "app/ui/forms/inputs/ImageInput.tsx",
  "app/ui/forms/inputs/richText/RecordLinkPicker.tsx",
  "app/ui/forms/inputs/richText/RichTextToolbar.tsx",
  // app/ui/geography
  "app/ui/geography/AttachEntityButton.tsx",
  "app/ui/geography/CreatePlaceForm.tsx",
  "app/ui/geography/CreateWorldForm.tsx",
  "app/ui/geography/GeographyExplorer.tsx",
  "app/ui/geography/MapGridConfigPanel.tsx",
  "app/ui/geography/MapGridOverlay.tsx",
  "app/ui/geography/MapGridToggle.tsx",
  "app/ui/geography/MapMeasureTool.tsx",
  "app/ui/geography/MapOptionsButton.tsx",
  "app/ui/geography/MapUploadControl.tsx",
  "app/ui/geography/OutlineEditBar.tsx",
  "app/ui/geography/PlaceCatalogueList.tsx",
  "app/ui/geography/PlaceEntityList.tsx",
  "app/ui/geography/PlaceMapLink.tsx",
  "app/ui/geography/PlacePopover.tsx",
  "app/ui/geography/PlaceRevealDialog.tsx",
  "app/ui/geography/RemovalOutcomeChoices.tsx",
  "app/ui/geography/RemoveLandmarkDialog.tsx",
  "app/ui/geography/RemovePlaceDialog.tsx",
  "app/ui/geography/WorldMap.tsx",
  "app/ui/geography/ZoneEditPanel.tsx",
  // app/ui/richText
  "app/ui/richText/ClientResolvedRecordLinks.tsx",
  "app/ui/richText/RecordLink.tsx",
  "app/ui/richText/ResolvedRecordLinks.tsx",
  // app/ui/search
  "app/ui/search/CrossEntitySearchResults.tsx",
];
