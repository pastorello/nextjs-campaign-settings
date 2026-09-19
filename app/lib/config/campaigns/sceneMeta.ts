import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import SceneMetaField from "@/app/lib/definitions/enums/campaign/SceneMetaField";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";
import firstOptionValue from "../firstOptionValue";
import nullableAmountValidator from "@/app/lib/utils/validators/nullableAmountValidator";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";
import z from "zod";

import sceneKinds from "./scene-kinds";

/**
 * A scene's own scalar fields (SPEC-013 §5/§6) — outside the metadata layer
 * (ADR-0011), declared here so the bespoke scene editor (T8) consumes each
 * field's validator and label key rather than restating them. `zoneId` is a
 * plain nullable FK, like `npc.faction` — the foreign key itself is the
 * membership check, not a static options list — and, unlike
 * `assignNpcLocation`'s zone/poi pair, there is no cross-field invariant to
 * resolve server-side, so it is a normal field on `createScene`/`updateScene`
 * rather than a bespoke assignment action.
 */
const sceneMeta = {
  [SceneMetaField.position]: {
    metaField: "position",
    labelKey: "scene.fields.position.label",
    defaultValue: 1,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int(),
  },
  [SceneMetaField.kind]: {
    metaField: "kind",
    labelKey: "scene.fields.kind.label",
    defaultValue: firstOptionValue(sceneKinds),
    fieldType: FieldType.string,
    options: sceneKinds,
    controlType: ControlType.Select,
    validator: z.nativeEnum(SceneKind),
  },
  [SceneMetaField.title]: {
    metaField: "title",
    labelKey: "scene.fields.title.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().min(1),
  },
  [SceneMetaField.description]: {
    metaField: "description",
    labelKey: "scene.fields.description.label",
    defaultValue: "",
    fieldType: FieldType.string,
    // Formatted text (SPEC-019 T5): the validator sanitises it.
    controlType: ControlType.RichText,
    // Nullable column, `string | null` domain type — see
    // `nullableToOptional`'s own comment (TD-130).
    validator: nullableToOptional(richTextValidator().optional()),
  },
  [SceneMetaField.xpAward]: {
    metaField: "xpAward",
    labelKey: "scene.fields.xpAward.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    // "Unset is not zero" — an unawarded scene's XP still has to net out of
    // the "assigned" total honestly (SPEC-013 §6) rather than silently
    // reading as zero XP offered. See `nullableAmountValidator` (TD-130).
    validator: nullableAmountValidator(),
    getDatum: (datum: number | null) => (datum === null ? "—" : datum),
  },
  [SceneMetaField.grantsHeroPoint]: {
    metaField: "grantsHeroPoint",
    labelKey: "scene.fields.grantsHeroPoint.label",
    defaultValue: false,
    fieldType: FieldType.boolean,
    controlType: ControlType.Bool,
    validator: z.coerce.boolean().optional(),
  },
  [SceneMetaField.zoneId]: {
    metaField: "zoneId",
    labelKey: "scene.fields.zoneId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "zone",
    controlType: ControlType.Select,
    validator: z.coerce.number().int().positive().nullable(),
  },
} satisfies Record<string, PageMeta>;

export default sceneMeta;
