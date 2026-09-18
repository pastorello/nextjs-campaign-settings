import type CalendarEventFieldsInput from "./CalendarEventFieldsInput";

/**
 * What the campaign calendar's form sends to `createCampaignEvent` /
 * `updateCampaignEvent` (SPEC-014 §5.4, T6): the shared event fields and
 * the adventure and scene it names, `null` for none. The campaign is not
 * here: a create takes it as its own argument, and an edit never moves an
 * event to another campaign.
 */
interface CampaignEventInput extends CalendarEventFieldsInput {
  adventureId: number | null;
  sceneId: number | null;
}

export default CampaignEventInput;
