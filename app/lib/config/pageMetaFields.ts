import z from "zod";

import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import FieldType from "@/app/lib/definitions/types/FieldType";
import ControlType from "@/app/lib/definitions/types/ControlType";

import npcMeta from "./npc/npcMeta";
import spellsMeta from "./spells/SpellsMeta";
import magicItemsMeta from "./magicitem/magicItemMeta";
import deitiesMeta from "./deity/deityMeta";
import renderRichText from "../utils/data/renderRichText";

/**
 * Fields more than one domain meta may declare without it being an accident —
 * see `pagesConfig.ts`'s note on why the deity pages reach for `NpcMetaField`.
 * Add a name here only when it genuinely means the same thing in every domain
 * that shares it.
 */
type SharedMetaField = "alignment" | "alignmentDomain";

/**
 * Keys two domain metas both declare, outside the deliberately shared set.
 * Domain metas key their entries by enum member, and string enums are
 * nominal — `DeityMetaField.alignment` and `NpcMetaField.alignment` are
 * different types despite both being `"alignment"` (see `MetaConfigKey`'s own
 * note on this). A bare `keyof A & keyof B` would intersect to `never` even
 * when the two really do collide, silently defeating the whole check; the
 * template literal coerces each side to its underlying string first, the way
 * `MetaConfigKey` already does.
 */
type CollidingKeys<
  A extends Record<string, unknown>,
  B extends Record<string, unknown>,
> = Exclude<
  `${Extract<keyof A, string>}` & `${Extract<keyof B, string>}`,
  SharedMetaField
>;

/**
 * Fails to typecheck unless every domain-meta pair below is disjoint outside
 * `SharedMetaField`. `object spread` does not report duplicate keys — the
 * last one wins silently — so without this, a field name reused across two
 * domain metas would compile clean and one domain's declaration would just
 * disappear at runtime. See TD-74.
 *
 * A mapped type rather than a union of `CollidingKeys<...>`: today every pair
 * is genuinely disjoint, so a union of six `never`s would be indistinguishable
 * constituents — exactly what `no-duplicate-type-constituents` and
 * `no-redundant-type-constituents` exist to catch, and rightly so for a real
 * union. This isn't one; each property below type-checks independently
 * against `never`; whichever pair collides names itself in the error.
 */
type DomainMetaPairs = {
  deitiesSpells: CollidingKeys<typeof deitiesMeta, typeof spellsMeta>;
  deitiesMagicItems: CollidingKeys<typeof deitiesMeta, typeof magicItemsMeta>;
  deitiesNpc: CollidingKeys<typeof deitiesMeta, typeof npcMeta>;
  spellsMagicItems: CollidingKeys<typeof spellsMeta, typeof magicItemsMeta>;
  spellsNpc: CollidingKeys<typeof spellsMeta, typeof npcMeta>;
  magicItemsNpc: CollidingKeys<typeof magicItemsMeta, typeof npcMeta>;
};
type AssertAllDisjoint<T extends Record<keyof DomainMetaPairs, never>> = T;
export type DomainMetaFieldsAreDisjoint = AssertAllDisjoint<DomainMetaPairs>;

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
   * they already share `alignment`/`alignmentDomain` (see `pagesConfig.ts`'s
   * note on last-spread-wins).
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
