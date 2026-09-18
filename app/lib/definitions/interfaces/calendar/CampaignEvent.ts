import type CalendarEventBase from "./CalendarEventBase";
import type LinkedRow from "./LinkedRow";

/**
 * A campaign event as the campaign calendar reads it (SPEC-014 §5.4, T6):
 * the event's own fields and the adventure and scene it names, by title.
 */
interface CampaignEvent extends CalendarEventBase {
  adventure: LinkedRow | null;
  scene: LinkedRow | null;
}

export default CampaignEvent;
