import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import SceneMetaField from "@/app/lib/definitions/enums/campaign/SceneMetaField";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";
import firstOptionValue from "../firstOptionValue";
import z from "zod";

import sceneKinds from "./scene-kinds";

/**
 * `xpAward` is preserved as `null` rather than coerced to `0` when left
 * blank — the same "unset is not zero" convention `adventureMeta`'s budget
 * targets use, since an unawarded scene's XP still has to net out of the
 * "assigned" total honestly (SPEC-013 §6's counting rule) rather than
 * silently reading as zero XP offered.
 */
function nullableAmountValidator() {
  return z.preprocess(
    (raw) => (raw === "" || raw === undefined ? null : raw),
    z.coerce.number().int().gte(0).nullable()
  );
}

/**
 * `description` maps to a nullable column and `Scene`'s domain interface
 * types it `string | null` accordingly, not optional — so a caller that
 * leaves it unset (the scene editor's create/edit form, T8) supplies an
 * explicit `null` rather than omitting the key. `.optional()` alone only
 * tolerates `undefined`; this preprocesses `null` the same way before
 * handing off, the same shape `adventureMeta.ts`'s own `nullableToOptional`
 * already uses for `synopsis`/`timeline`. Found and fixed in the browser
 * during T8, the same way T7 found `adventureMeta`'s version of this bug.
 */
function nullableToOptional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((raw) => (raw === null ? undefined : raw), schema);
}

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
    controlType: ControlType.Textarea,
    validator: nullableToOptional(z.string().optional()),
  },
  [SceneMetaField.xpAward]: {
    metaField: "xpAward",
    labelKey: "scene.fields.xpAward.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
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
