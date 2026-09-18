import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import WorldHistoryLinkField from "@/app/lib/definitions/enums/calendar/WorldHistoryLinkField";
import z from "zod";

/** A list of row ids; that each row exists is `findMissingEventLinks`' job. */
const idListValidator = z.array(z.number().int().positive());

/**
 * A world history event's links (SPEC-014 §5.4) — many-to-many, so each is
 * a multiselect over the table it names. Membership is checked against the
 * table by `findMissingEventLinks`, the same "the table is the check" rule
 * as a single table-backed field (SPEC-006 §7). Kept apart from
 * `calendarEventMeta` because campaign events (T6) have no links at all.
 */
const worldHistoryLinkMeta = {
  [WorldHistoryLinkField.zoneIds]: {
    metaField: "zoneIds",
    labelKey: "calendar.event.fields.zoneIds.label",
    defaultValue: [],
    fieldType: FieldType.array,
    optionTable: "zone",
    controlType: ControlType.Multiselect,
    validator: idListValidator,
  },
  [WorldHistoryLinkField.npcIds]: {
    metaField: "npcIds",
    labelKey: "calendar.event.fields.npcIds.label",
    defaultValue: [],
    fieldType: FieldType.array,
    optionTable: "npc",
    controlType: ControlType.Multiselect,
    validator: idListValidator,
  },
  [WorldHistoryLinkField.deityIds]: {
    metaField: "deityIds",
    labelKey: "calendar.event.fields.deityIds.label",
    defaultValue: [],
    fieldType: FieldType.array,
    optionTable: "deities",
    controlType: ControlType.Multiselect,
    validator: idListValidator,
  },
  [WorldHistoryLinkField.factionIds]: {
    metaField: "factionIds",
    labelKey: "calendar.event.fields.factionIds.label",
    defaultValue: [],
    fieldType: FieldType.array,
    optionTable: "faction",
    controlType: ControlType.Multiselect,
    validator: idListValidator,
  },
} satisfies Record<string, PageMeta>;

export default worldHistoryLinkMeta;
