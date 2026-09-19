import { z } from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhClassMetaField from "@/app/lib/definitions/enums/daggerheart/DhClassMetaField";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import nullableToOptional from "@/app/lib/utils/validators/nullableToOptional";
import richTextValidator from "@/app/lib/utils/validators/richTextValidator";

/**
 * A domain reference: required, and a real `dhDomain` row — the foreign key
 * is the membership check (SPEC-006 §7's table-backed shape). `null` is the
 * form's "nothing picked yet", so it is refused here rather than defaulted.
 */
const domainValidator = () => z.number().int().positive();

/** Starting Evasion and HP: whole numbers, zero or more (SPEC-021 T4). */
const nonNegativeIntegerValidator = () => z.coerce.number().int().min(0);

/**
 * A Daggerheart class's own fields (SPEC-021 §5.4/§7). `name`,
 * `description` and `origin` are the shared declarations in
 * `pageMetaFields`. That the two domains differ is a cross-field rule no
 * single validator can state: `createDhClass`/`updateDhClass` refine it onto
 * `domainBId`, and the table's CHECK enforces it again.
 */
const dhClassMeta = {
  [DhClassMetaField.domainAId]: {
    metaField: "domainAId",
    labelKey: "dhClasses.fields.domainAId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "dhDomain",
    noneOptionKey: "dhClasses.fields.domainNoneOption",
    controlType: ControlType.Select,
    validator: domainValidator(),
  },
  [DhClassMetaField.domainBId]: {
    metaField: "domainBId",
    labelKey: "dhClasses.fields.domainBId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "dhDomain",
    noneOptionKey: "dhClasses.fields.domainNoneOption",
    controlType: ControlType.Select,
    validator: domainValidator(),
  },
  [DhClassMetaField.startingEvasion]: {
    metaField: "startingEvasion",
    labelKey: "dhClasses.fields.startingEvasion.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nonNegativeIntegerValidator(),
    getDatum: (datum: number) => datum,
  },
  [DhClassMetaField.startingHp]: {
    metaField: "startingHp",
    labelKey: "dhClasses.fields.startingHp.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: nonNegativeIntegerValidator(),
    getDatum: (datum: number) => datum,
  },
  [DhClassMetaField.classItems]: {
    metaField: "classItems",
    labelKey: "dhClasses.fields.classItems.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    // Nullable column — see `nullableToOptional` (TD-130).
    validator: nullableToOptional(richTextValidator().optional()),
    getDatum: (datum: string) => renderRichText(datum),
  },
  [DhClassMetaField.hopeFeatureName]: {
    metaField: "hopeFeatureName",
    labelKey: "dhClasses.fields.hopeFeatureName.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().trim().min(1),
    getDatum: (datum: string) => datum,
  },
  [DhClassMetaField.hopeFeatureText]: {
    metaField: "hopeFeatureText",
    labelKey: "dhClasses.fields.hopeFeatureText.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.RichText,
    validator: richTextValidator().pipe(z.string().min(1)),
    getDatum: (datum: string) => renderRichText(datum),
  },
} satisfies Record<string, PageMeta>;

export default dhClassMeta;
