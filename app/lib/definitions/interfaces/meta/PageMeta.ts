import { ReactNode } from "react";
import { ZodType } from "zod";

import SelectOption from "@/app/lib/definitions/types/SelectOption";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";

/**
 * What a field's value can look like when it reaches the UI. Arrays are
 * included because `getDataLabel` genuinely accepts them — a multiselect
 * renders all of its chosen labels joined, so `circolo.getDatum` is handed the
 * whole array, not one element, despite what its narrowed declaration says.
 */
type MetaDisplayValue = string | number | boolean | number[] | string[];

/**
 * Tables whose rows can back a field's options — closed, like `PlaceKind`.
 * A union of one until a second field genuinely needs this (SPEC-006 §9's
 * open question 1); collapse it if nothing joins `faction` within a couple
 * of features rather than keeping the indirection for symmetry.
 */
type OptionTableName = "faction";

/**
 * A field's options are either a static list or rows in a table — never
 * both. Declaring both is a compile error rather than a state some
 * consumer has to arbitrate (the same "make the wrong state unrepresentable"
 * argument ADR-0009 used for deriving `navigable` from `kind`).
 *
 * Kept as an intersection with `PageMetaBase` rather than folded into it:
 * rewriting `options` into `{ source: "static", values } | { source: "table",
 * table }` would touch all twenty static declarations for zero behavioural
 * gain (SPEC-006 §7).
 */
interface StaticOptionsMeta {
  options?: SelectOption[];
  optionTable?: never;
}

interface TableOptionsMeta {
  options?: never;
  optionTable: OptionTableName;
}

type OptionsDeclaration = StaticOptionsMeta | TableOptionsMeta;

interface PageMetaBase {
  /** The field's key: lowercase, and identical to the payload key and DB column. */
  metaField: string;
  controlType: ControlType;
  /** Message key resolved with `t()` at the render boundary — see ADR-0007. */
  labelKey?: string;
  /** Message key, read only for `ControlType.Text` / `ControlType.Textarea`. */
  placeholderKey?: string;

  /**
   * Value → display label, for fields that genuinely format (rich text,
   * booleans, identity). Optional: an option-backed field (`options` set)
   * displays by resolving through those options — see
   * `app/lib/utils/data/resolveFieldValue.ts` — and does not declare its own
   * `getDatum` (ADR-0007 deletes the closures that used to restate that
   * lookup by hand).
   *
   * Declared with method syntax on purpose. Method parameters are bivariant, so
   * a declaration may narrow to exactly what it handles (`(datum: number)`)
   * while the ~50 call sites, which read a value out of a domain interface,
   * still type-check against the broad input. A property-style signature would
   * be contravariant and force every declaration to accept all three types,
   * which buys nothing: the metadata is authored in one place and the narrow
   * signature is the useful documentation.
   */
  getDatum?(rawValue: MetaDisplayValue, useShortLabel?: boolean): ReactNode;
}

/**
 * A whole-number field. `options`/`optionTable` present when rendered as a
 * select. `defaultValue` and `validator` admit `null` for the table-backed
 * case only: `firstOptionValue` has no list to read from a table, so "no
 * selection" is the honest default, and the FK — not a module-scope
 * `Set` — is what checks membership (SPEC-006 §7).
 */
interface IntegerFieldMeta extends PageMetaBase {
  fieldType: FieldType.integer;
  defaultValue: number | null;
  validator: ZodType<number | null | undefined>;
}

interface StringFieldMeta extends PageMetaBase {
  fieldType: FieldType.string;
  defaultValue: string;
  validator: ZodType<string | undefined>;
}

interface BooleanFieldMeta extends PageMetaBase {
  fieldType: FieldType.boolean;
  defaultValue: boolean;
  validator: ZodType<boolean | undefined>;
}

/** A multi-select field. The value is an array; `getDatum` renders one element. */
interface ArrayFieldMeta extends PageMetaBase {
  fieldType: FieldType.array;
  defaultValue: number[] | string[];
  validator: ZodType<number[] | string[] | undefined>;
}

/**
 * One field's declaration, discriminated on `fieldType` so that `defaultValue`
 * and `validator` cannot disagree with it. Before TD-08 both were `any`, and
 * `fieldType: FieldType.array` with `validator: z.string()` type-checked
 * happily — the metadata layer's central invariant was unenforced.
 */
type PageMeta = (
  IntegerFieldMeta | StringFieldMeta | BooleanFieldMeta | ArrayFieldMeta
) &
  OptionsDeclaration;

export default PageMeta;
export type { MetaDisplayValue, OptionTableName };
