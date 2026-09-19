import { z } from "zod";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhSubclassMetaField from "@/app/lib/definitions/enums/daggerheart/DhSubclassMetaField";
import DhSpellcastTrait from "@/app/lib/definitions/enums/daggerheart/DhSpellcastTrait";

import dhSpellcastTraits, { NO_SPELLCAST_TRAIT } from "./dh-spellcast-traits";

/**
 * A Daggerheart subclass's own fields (SPEC-021 §5.5/§7). `name`,
 * `description` and `origin` are the shared declarations in
 * `pageMetaFields`.
 */
const dhSubclassMeta = {
  // Required, and a real `dhClass` row: the foreign key is the membership
  // check. Also the list's header filter (SPEC-021 T5).
  [DhSubclassMetaField.classId]: {
    metaField: "classId",
    labelKey: "dhSubclasses.fields.classId.label",
    defaultValue: null,
    fieldType: FieldType.integer,
    optionTable: "dhClass",
    noneOptionKey: "dhSubclasses.fields.classId.noneOption",
    controlType: ControlType.Select,
    validator: z.number().int().positive(),
  },
  // "none" stands for the column's `null` (see `NO_SPELLCAST_TRAIT`): a
  // string field's validator cannot output `null`, and the select needs a
  // value for "does not cast" anyway.
  [DhSubclassMetaField.spellcastTrait]: {
    metaField: "spellcastTrait",
    labelKey: "dhSubclasses.fields.spellcastTrait.label",
    defaultValue: NO_SPELLCAST_TRAIT,
    fieldType: FieldType.string,
    options: dhSpellcastTraits,
    controlType: ControlType.Select,
    validator: z.union([
      z.literal(NO_SPELLCAST_TRAIT),
      z.nativeEnum(DhSpellcastTrait),
    ]),
  },
} satisfies Record<string, PageMeta>;

export default dhSubclassMeta;
