import z from "zod";

import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import FieldType from "@/app/lib/definitions/types/FieldType";
import ControlType from "@/app/lib/definitions/types/ControlType";

import npcMeta from "./npc/npcMeta";
import spellsMeta from "./spells/SpellsMeta";
import magicItemsMeta from "./magicitem/magicItemMeta";
import deitiesMeta from "./deity/deityMeta";
import treasureMeta from "./treasure/treasureMeta";
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
  deitiesTreasure: CollidingKeys<typeof deitiesMeta, typeof treasureMeta>;
  spellsTreasure: CollidingKeys<typeof spellsMeta, typeof treasureMeta>;
  magicItemsTreasure: CollidingKeys<typeof magicItemsMeta, typeof treasureMeta>;
  npcTreasure: CollidingKeys<typeof npcMeta, typeof treasureMeta>;
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
   * The stored `zoneId`/`poiId` reference (SPEC-008 T6) — a real, sortable,
   * filterable admin-list column, replacing the previous `derivedLocation`
   * field (an in-memory tree walk over the map's pins, removed here: SPEC-008
   * T5 already removed the only way that tree ever grew a new pin, so it
   * would only have gone stale for every entity placed from now on). Read-
   * only and absent from every domain's `pagesConfig` entry — never part of
   * a create/update payload, since `assignLocation` (T3) is the only writer
   * — and shared here rather than duplicated per domain because it means
   * exactly the same thing for both. `getDatum` is a pure passthrough:
   * `EntityList` resolves the actual title (the POI's if `poiId` is set,
   * else the Zone's, else "Sconosciuta") from `fetchDerivedAncestry` →
   * `toDerivedPlacements` — the same path `EntityLibrary` reads for the
   * public cards (TD-77) — before this ever sees the value. Sorting/
   * filtering key on the raw `zoneId` column, not this display string —
   * see `buildLocationWhere.ts`/`applyLocationSort.ts`.
   */
  location: {
    metaField: "location",
    labelKey: "common.table.location",
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
  ...treasureMeta,
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
