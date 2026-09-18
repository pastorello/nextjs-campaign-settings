import type CalendarEventFieldsInput from "./CalendarEventFieldsInput";

/**
 * What the world history form sends to `createWorldHistoryEvent` /
 * `updateWorldHistoryEvent` (SPEC-014 §5.4): the shared event fields and
 * the linked rows' ids.
 */
interface WorldHistoryEventInput extends CalendarEventFieldsInput {
  zoneIds: number[];
  npcIds: number[];
  deityIds: number[];
  factionIds: number[];
}

export default WorldHistoryEventInput;
