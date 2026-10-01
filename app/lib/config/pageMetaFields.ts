import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
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
import richTextValidator from "../utils/validators/richTextValidator";
import imageMeta from "./image/imageMeta";
import {
  revealedToDnd5eMeta,
  revealedToMeta,
} from "./visibility/revealedToMeta";
import dhOriginMeta from "./daggerheart/dhOriginMeta";
import dhDomainMeta from "./daggerheart/dhDomainMeta";
import dhDomainCardMeta from "./daggerheart/dhDomainCardMeta";
import dhClassMeta from "./daggerheart/dhClassMeta";
import dhSubclassMeta from "./daggerheart/dhSubclassMeta";
import dhAncestryMeta from "./daggerheart/dhAncestryMeta";
import dhCommunityMeta from "./daggerheart/dhCommunityMeta";
import dhAdversaryMeta from "./daggerheart/dhAdversaryMeta";
import dhEnvironmentMeta from "./daggerheart/dhEnvironmentMeta";
import { dhDifficultyMeta, dhTierMeta } from "./daggerheart/dhSharedStatMetas";

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
 * The domain metas spread into the registry below, by name. Every one is
 * checked against every other: add a new domain meta here as well as to the
 * spread, or it escapes the check.
 */
type DomainMetas = {
  deities: typeof deitiesMeta;
  spells: typeof spellsMeta;
  magicItems: typeof magicItemsMeta;
  npc: typeof npcMeta;
  treasure: typeof treasureMeta;
  dhDomain: typeof dhDomainMeta;
  dhDomainCard: typeof dhDomainCardMeta;
  dhClass: typeof dhClassMeta;
  dhSubclass: typeof dhSubclassMeta;
  dhAncestry: typeof dhAncestryMeta;
  dhCommunity: typeof dhCommunityMeta;
  dhAdversary: typeof dhAdversaryMeta;
  dhEnvironment: typeof dhEnvironmentMeta;
};

/**
 * Fails to typecheck unless every pair of domain metas is disjoint outside
 * `SharedMetaField`. `object spread` does not report duplicate keys — the
 * last one wins silently — so without this, a field name reused across two
 * domain metas would compile clean and one domain's declaration would just
 * disappear at runtime. See TD-74.
 *
 * Every pair, computed: the list of pairs used to be written by hand, and
 * by SPEC-027 it had already missed some (a domain against a class). A
 * collision names both metas and the key in the error, as
 * `DomainMetaPairs[A][B]` failing to be `never`.
 */
type DomainMetaPairs = {
  [A in keyof DomainMetas]: {
    [B in Exclude<keyof DomainMetas, A>]: CollidingKeys<
      DomainMetas[A],
      DomainMetas[B]
    >;
  };
};
type AssertAllDisjoint<
  T extends { [A in keyof T]: { [B in keyof T[A]]: never } },
> = T;
export type DomainMetaFieldsAreDisjoint = AssertAllDisjoint<DomainMetaPairs>;

const pageMetaFields = {
  //GENERAL
  description: {
    metaField: "description",
    labelKey: "common.fields.description.label",
    defaultValue: "",
    fieldType: FieldType.string,
    // Formatted text (SPEC-019 T5): the validator sanitises it.
    controlType: ControlType.RichText,
    placeholderKey: "common.fields.description.placeholder",
    validator: richTextValidator(),
    getDatum: (datum: string) => renderRichText(datum),
    // Long-form prose across every domain that has this field (TD-120).
    tall: true,
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
      .gt(-1, { message: "positiveAmount" satisfies FieldErrorKey }),
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
  // A record's one image (SPEC-020 T3) — declared in `imageMeta`, which
  // `zoneMeta` composes too, so places and the metadata-driven domains
  // share one validator and one label key.
  imageId: imageMeta,
  // The campaigns a record is revealed to (SPEC-022 T6), declared once.
  revealedTo: revealedToMeta,
  revealedToDnd5e: revealedToDnd5eMeta,
  ...deitiesMeta,
  ...spellsMeta,
  ...magicItemsMeta,
  ...npcMeta,
  ...treasureMeta,
  // Every Daggerheart catalogue's `origin` (SPEC-021), declared once.
  origin: dhOriginMeta,
  // A stat block's tier and Difficulty (SPEC-028 §9 decision 4), likewise.
  tier: dhTierMeta,
  difficulty: dhDifficultyMeta,
  ...dhDomainMeta,
  ...dhDomainCardMeta,
  ...dhClassMeta,
  ...dhSubclassMeta,
  ...dhAncestryMeta,
  ...dhCommunityMeta,
  ...dhAdversaryMeta,
  ...dhEnvironmentMeta,
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
