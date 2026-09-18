import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import CampaignEventOwnerField from "@/app/lib/definitions/enums/calendar/CampaignEventOwnerField";
import z from "zod";

/** A row id, or `null` for none; that the row fits is checked afterwards. */
const optionalIdValidator = z.number().int().positive().nullable();

/**
 * The adventure and scene a campaign event may name (SPEC-014 §5.4, T6).
 * Each is a select, but over the campaign's own adventures and scenes, so
 * the page reads the options rather than an `optionTable` naming a whole
 * table. That the adventure belongs to the campaign and the scene to the
 * adventure is `resolveCampaignEventOwner`'s job — a validator cannot read
 * the database. Kept apart from `calendarEventMeta` because world history
 * events have no owner at all.
 */
const campaignEventOwnerMeta = {
  [CampaignEventOwnerField.adventureId]: {
    metaField: "adventureId",
    labelKey: "calendar.event.fields.adventureId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: optionalIdValidator,
  },
  [CampaignEventOwnerField.sceneId]: {
    metaField: "sceneId",
    labelKey: "calendar.event.fields.sceneId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Select,
    validator: optionalIdValidator,
  },
} satisfies Record<string, PageMeta>;

export default campaignEventOwnerMeta;
