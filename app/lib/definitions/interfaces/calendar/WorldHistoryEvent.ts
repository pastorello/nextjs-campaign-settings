import type CalendarEventBase from "./CalendarEventBase";
import type LinkedRow from "./LinkedRow";

/**
 * A world history event as the list reads it (SPEC-014 §5.4/§5.6): the
 * event's own fields and its links by name, so the list can show and link
 * each one without a second read.
 */
interface WorldHistoryEvent extends CalendarEventBase {
  zones: LinkedRow[];
  npcs: LinkedRow[];
  deities: LinkedRow[];
  factions: LinkedRow[];
}

export default WorldHistoryEvent;
