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

interface PageMetaBase {
  /** The field's key: lowercase, and identical to the payload key and DB column. */
  metaField: string;
  controlType: ControlType;
  label?: string;
  placeholder?: string;
  options?: SelectOption[];

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

/** A whole-number field. `options` present when rendered as a select. */
interface IntegerFieldMeta extends PageMetaBase {
  fieldType: FieldType.integer;
  defaultValue: number;
  validator: ZodType<number | undefined>;
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
type PageMeta =
  IntegerFieldMeta | StringFieldMeta | BooleanFieldMeta | ArrayFieldMeta;

export default PageMeta;
export type { MetaDisplayValue };
