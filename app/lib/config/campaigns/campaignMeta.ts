import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import CampaignMetaField from "@/app/lib/definitions/enums/campaign/CampaignMetaField";
import z from "zod";

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
/**
 * `Campaign.synopsis` is `string | null` in the domain interface, so
 * `CampaignForm` submits an unset synopsis as an explicit `null` rather than
 * omitting the key. `.optional()` alone only tolerates `undefined`; this
 * preprocesses `null` the same way before handing off — the same local
 * helper `adventureMeta.ts`, `sceneMeta.ts` and `sceneCreatureMeta.ts`
 * already carry for the same reason (found by T7's browser pass there; found
 * here by T10's a11y e2e, whose fixture setup is a minimal title-only create).
 */
function nullableToOptional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((raw) => (raw === null ? undefined : raw), schema);
}

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
    controlType: ControlType.Textarea,
    validator: nullableToOptional(z.string().optional()),
  },
  [CampaignMetaField.partySize]: {
    metaField: "partySize",
    labelKey: "campaign.fields.partySize.label",
    defaultValue: 4,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().positive(),
  },
} satisfies Record<string, PageMeta>;

export default campaignMeta;
