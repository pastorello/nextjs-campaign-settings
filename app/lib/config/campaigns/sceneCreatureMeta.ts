import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import SceneCreatureMetaField from "@/app/lib/definitions/enums/campaign/SceneCreatureMetaField";
import nullableAmountValidator from "@/app/lib/utils/validators/nullableAmountValidator";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import z from "zod";

/**
 * A scene creature row's own scalar fields (SPEC-013 §5/§6) — outside the
 * metadata layer (ADR-0011), declared here so the bespoke scene editor (T8)
 * consumes each field's validator and label key rather than restating them.
 * `npcId` is a plain nullable FK, like `sceneMeta.zoneId` — the foreign key
 * is the membership check, and deleting the linked NPC nulls it rather than
 * cascading (§5's edge case), which is enforced by the schema's
 * `onDelete: SetNull`, not app code.
 */
const sceneCreatureMeta = {
  [SceneCreatureMetaField.position]: {
    metaField: "position",
    labelKey: "sceneCreature.fields.position.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int(),
  },
  [SceneCreatureMetaField.name]: {
    metaField: "name",
    labelKey: "sceneCreature.fields.name.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().min(1),
  },
  [SceneCreatureMetaField.level]: {
    metaField: "level",
    labelKey: "sceneCreature.fields.level.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    // "Unset is not zero" — same convention as `sceneMeta.xpAward`. See
    // `nullableAmountValidator` (TD-130).
    validator: nullableAmountValidator(),
    getDatum: (datum: number | null) => (datum === null ? "—" : datum),
  },
  [SceneCreatureMetaField.xpEach]: {
    metaField: "xpEach",
    labelKey: "sceneCreature.fields.xpEach.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nullableAmountValidator(),
    getDatum: (datum: number | null) => (datum === null ? "—" : datum),
  },
  [SceneCreatureMetaField.quantity]: {
    metaField: "quantity",
    labelKey: "sceneCreature.fields.quantity.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().positive(),
  },
  [SceneCreatureMetaField.note]: {
    metaField: "note",
    labelKey: "sceneCreature.fields.note.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    // Nullable column, `string | null` domain type — see
    // `nullableToOptional`'s own comment (TD-130).
    validator: nullableToOptional(z.string().optional()),
  },
  [SceneCreatureMetaField.npcId]: {
    metaField: "npcId",
    labelKey: "sceneCreature.fields.npcId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "npc",
    controlType: ControlType.Select,
    validator: z.coerce.number().int().positive().nullable(),
  },
} satisfies Record<string, PageMeta>;

export default sceneCreatureMeta;
