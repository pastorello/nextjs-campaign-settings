import z from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";

/**
 * A list of campaign ids; that each exists is `checkRevealCampaigns`' job.
 * Optional: a payload that leaves the field out reveals to nobody on create
 * and leaves the reveals alone on update.
 */
const campaignIdsValidator = z.array(z.number().int().positive()).optional();

/**
 * The campaigns a record is revealed to (SPEC-022 T6), a multiselect over
 * campaigns. Every record starts revealed to none. A campaign's players see
 * a record only once it is revealed to their campaign (T7/T8 read it).
 *
 * Declared once and composed into the registry under two keys:
 * - `revealedTo` offers every campaign. It is for the shared world (NPCs,
 *   deities and factions), which every system's campaigns play in.
 * - `revealedToDnd5e` offers 5e campaigns only. It is for magic items, a 5e
 *   catalogue, so the picker cannot offer a Daggerheart campaign, and the
 *   action refuses one anyway.
 *
 * Both read and write the Prisma relation `revealedTo`.
 */
export const revealedToMeta = {
  metaField: "revealedTo",
  labelKey: "common.fields.revealedTo.label",
  defaultValue: [],
  fieldType: FieldType.array,
  optionTable: "campaign",
  controlType: ControlType.Multiselect,
  validator: campaignIdsValidator,
} satisfies PageMeta;

export const revealedToDnd5eMeta = {
  ...revealedToMeta,
  metaField: "revealedToDnd5e",
  optionTable: "dnd5eCampaign",
} satisfies PageMeta;
