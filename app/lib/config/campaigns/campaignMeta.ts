import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import CampaignMetaField from "@/app/lib/definitions/enums/campaign/CampaignMetaField";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";
import { GAME_SYSTEMS } from "@/app/lib/definitions/GameSystem";
import z from "zod";
import firstOptionValue from "../firstOptionValue";
import gameSystems from "./game-systems";

/**
 * The campaign's own scalar fields (SPEC-013 §5/§6). Outside the metadata
 * layer proper — there is no campaign list page, so this is never spread
 * into `pageMetaFields.ts` and never registered in `pagesConfig.ts`,
 * `queryFields.ts` or `listConfig.ts` (ADR-0011, amended 2026-08-19: a
 * campaign is a single record shown as an empty-state-created page, not a
 * filterable admin list). Declared anyway because the bespoke campaign page
 * (T7) consumes each field's validator and label key rather than restating
 * them — the same "shared either way" half of ADR-0011's boundary that
 * `scene`/`sceneCreature`/`loot` already use.
 */
const campaignMeta = {
  [CampaignMetaField.title]: {
    metaField: "title",
    labelKey: "campaign.fields.title.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().min(1),
  },
  [CampaignMetaField.synopsis]: {
    metaField: "synopsis",
    labelKey: "campaign.fields.synopsis.label",
    defaultValue: "",
    fieldType: FieldType.string,
    // Formatted text (SPEC-019 T5): the validator sanitises it.
    controlType: ControlType.RichText,
    // Nullable column, `string | null` domain type — see
    // `nullableToOptional`'s own comment (TD-130).
    validator: nullableToOptional(richTextValidator().optional()),
  },
  [CampaignMetaField.partySize]: {
    metaField: "partySize",
    labelKey: "campaign.fields.partySize.label",
    defaultValue: 4,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().positive(),
  },
  // SPEC-018 T3 / ADR-0013 rule 9. A raw `String` column checked against
  // the closed vocabulary here, like `adventureMeta.status`. Set once, at
  // creation: a campaign does not switch systems, so `updateCampaign` drops
  // this field. `CampaignForm` preselects the route's system; this default
  // only covers a caller with no route.
  [CampaignMetaField.system]: {
    metaField: "system",
    labelKey: "campaign.fields.system.label",
    defaultValue: firstOptionValue(gameSystems),
    fieldType: FieldType.string,
    options: gameSystems,
    controlType: ControlType.Select,
    validator: z.enum(GAME_SYSTEMS),
  },
} satisfies Record<string, PageMeta>;

export default campaignMeta;
