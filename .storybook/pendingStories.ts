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
  // app/ui/calendar
  "app/ui/calendar/CalendarEventFields.tsx",
  "app/ui/calendar/CalendarViewSwitch.tsx",
  "app/ui/calendar/CampaignCalendarFilters.tsx",
  "app/ui/calendar/CampaignCalendarList.tsx",
  "app/ui/calendar/CampaignEventForm.tsx",
  "app/ui/calendar/CampaignMonthGrid.tsx",
  "app/ui/calendar/CurrentDayForm.tsx",
  "app/ui/calendar/DateSystemForm.tsx",
  "app/ui/calendar/DateSystemToggle.tsx",
  "app/ui/calendar/DateSystemsPanel.tsx",
  "app/ui/calendar/EventList.tsx",
  "app/ui/calendar/EventSummary.tsx",
  "app/ui/calendar/MonthGrid.tsx",
  "app/ui/calendar/MonthGridNavigation.tsx",
  "app/ui/calendar/MoonReferenceForm.tsx",
  "app/ui/calendar/UpcomingEvents.tsx",
  "app/ui/calendar/WorldDate.tsx",
  "app/ui/calendar/WorldDateInput.tsx",
  "app/ui/calendar/WorldHistoryEventForm.tsx",
  "app/ui/calendar/WorldHistoryFilters.tsx",
  "app/ui/calendar/WorldHistoryList.tsx",
  "app/ui/calendar/WorldHistoryMonthGrid.tsx",
  // app/ui/campaigns
  "app/ui/campaigns/AdventureForm.tsx",
  "app/ui/campaigns/AdventureHeader.tsx",
  "app/ui/campaigns/AdventureInfoForm.tsx",
  "app/ui/campaigns/AdventureLadder.tsx",
  "app/ui/campaigns/ArchivedCampaigns.tsx",
  "app/ui/campaigns/BattlePointsSummary.tsx",
  "app/ui/campaigns/BudgetPanel.tsx",
  "app/ui/campaigns/CampaignActions.tsx",
  "app/ui/campaigns/CampaignForm.tsx",
  "app/ui/campaigns/CampaignHeader.tsx",
  "app/ui/campaigns/CampaignList.tsx",
  "app/ui/campaigns/CampaignPlayers.tsx",
  "app/ui/campaigns/CheckOffControl.tsx",
  "app/ui/campaigns/CopyAdventureDialog.tsx",
  "app/ui/campaigns/EncounterSummary.tsx",
  "app/ui/campaigns/LootForm.tsx",
  "app/ui/campaigns/LootList.tsx",
  "app/ui/campaigns/PartySizeControl.tsx",
  "app/ui/campaigns/SceneCreatureForm.tsx",
  "app/ui/campaigns/SceneCreatureList.tsx",
  "app/ui/campaigns/SceneForm.tsx",
  "app/ui/campaigns/SceneList.tsx",
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
