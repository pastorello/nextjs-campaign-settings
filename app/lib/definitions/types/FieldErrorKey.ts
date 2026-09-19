/**
 * Every message a mutation can refuse a field with, as a key under
 * `common.fieldErrors` in `messages/{it,en}.json` (TD-124). Server code
 * returns one of these, never prose; the render boundary translates it
 * (ADR-0007). A key missing from either catalogue fails
 * `FieldErrorKey.test.ts`.
 *
 * The first group is what `toFieldErrors` derives from Zod's own issue
 * codes, so Zod's English default messages never reach the UI. The second
 * is the keys a schema passes as a custom Zod `message` — `toFieldErrors`
 * recognises them by membership in this list. The rest are the data
 * layer's own refusals.
 */
export const FIELD_ERROR_KEYS = [
  // Derived from Zod issue codes
  "invalid",
  "invalidType",
  "invalidFormat",
  "invalidOption",
  "tooShort",
  "tooLong",
  "tooFewItems",
  "tooManyItems",
  "tooSmall",
  "tooSmallExclusive",
  "tooBig",
  "tooBigExclusive",
  "notMultipleOf",
  "unrecognizedKeys",
  // Custom schema messages
  "positiveAmount",
  "lootLinksBoth",
  "landmarkWithoutZone",
  "beforeDawnOfTime",
  "dayNotInMonth",
  "monthNamesCount",
  "weekdayNamesCount",
  "endBeforeStart",
  "repeatSpansOverAYear",
  "campaignEventNoLinks",
  // Data-layer refusals
  "areaTooSmall",
  "areaOverlaps",
  "areaCoversPlaces",
  "pointInsideArea",
  "placeOnOwnMap",
  "placeInsideOwnSubtree",
  "placeNotFound",
  "placeNeedsParent",
  "placeAlreadyPositioned",
  "rootCannotBePlaced",
  "rootCannotBeUnplaced",
  "rootHasNoParent",
  "worldAlreadyExists",
  "landmarkNotFound",
  "landmarkAlreadyPositioned",
  "zoneNotFound",
  "zoneLandmarkMismatch",
  "factionNotFound",
  "npcNotFound",
  "alreadyAtLocation",
  "noZonesAvailable",
  "deityNotFound",
  "adventureOrderMismatch",
  "sceneOrderMismatch",
  "sceneCreatureOrderMismatch",
  "lootOrderMismatch",
  "dateSystemNotFound",
  "universalDateSystemFixed",
  "universalDateSystemUndeletable",
  "defaultDateSystemUndeletable",
  "adventureNotInCampaign",
  "sceneNotInAdventure",
  "sceneNotInCampaign",
  // Record image upload refusals (SPEC-020, ADR-0017)
  "imageRequired",
  "imageTooLarge",
  "imageUnsupportedType",
  "imageUndecodable",
  "imageStoreFailed",
  // Attaching an uploaded image to a record (SPEC-020 T3)
  "imageNotFound",
  "imageInUse",
] as const;

type FieldErrorKey = (typeof FIELD_ERROR_KEYS)[number];

export default FieldErrorKey;
