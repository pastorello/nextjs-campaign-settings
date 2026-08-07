import z from "zod";

import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import FieldType from "@/app/lib/definitions/types/FieldType";
import ControlType from "@/app/lib/definitions/types/ControlType";

import npcMeta from "./npc/npcMeta";
import spellsMeta from "./spells/SpellsMeta";
import magicItemsMeta from "./magicitem/magicItemMeta";
import deitiesMeta from "./deity/deityMeta";
import renderRichText from "../utils/data/renderRichText";

const pageMetaFields = {
  //GENERAL
  description: {
    metaField: "description",
    labelKey: "common.fields.description.label",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Textarea,
    placeholderKey: "common.fields.description.placeholder",
    validator: z.string(),
    getDatum: (datum: string) => renderRichText(datum),
  },
  id: {
    metaField: "id",
    labelKey: "common.fields.id.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    placeholderKey: "common.fields.id.placeholder",
    validator: z.coerce
      .number()
      .gt(-1, { message: "Please enter a positive amount" }),
    getDatum: (datum: number) => datum,
  },
  name: {
    metaField: "name",
    labelKey: "common.fields.name.label",
    defaultValue: "",
    placeholderKey: "common.fields.name.placeholder",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string(),
    getDatum: (datum: string) => datum,
  },
  /**
   * Read-only, computed from the `poi` tree (SPEC-004 T4) — not a database
   * column, so deliberately absent from every domain's `pagesConfig` entry:
   * that list also drives `buildEntitySchema`'s write payload, and this
   * field is never something a create/update sends. It exists here, not in
   * `npcMeta`/`deityMeta`, because both list columns share it the same way
   * they already share `location` (see `pagesConfig.ts`'s note on
   * last-spread-wins).
   */
  derivedLocation: {
    metaField: "derivedLocation",
    labelKey: "common.table.derivedLocation",
    defaultValue: "",
    fieldType: FieldType.string,
    controlType: ControlType.Text,
    validator: z.string().optional(),
    getDatum: (datum: string) => datum,
  },
  ...deitiesMeta,
  ...spellsMeta,
  ...magicItemsMeta,
  ...npcMeta,
} satisfies Record<string, PageMeta>;

/**
 * The same registry seen through the `PageMeta` interface.
 *
 * `pageMetaFields` deliberately keeps its inferred literal type — that is what
 * lets `MetaConfigKey` be the union of the real field names. The cost is that
 * indexing it yields one specific declaration, whose optional `options` and
 * `placeholder` may simply not be there. Read through this view when you need
 * the declared shape rather than a particular field's.
 */
export const fieldMeta: Record<string, PageMeta> = pageMetaFields;

export default pageMetaFields;
