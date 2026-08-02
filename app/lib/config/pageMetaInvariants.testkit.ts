import { describe, expect, it } from "vitest";

import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta, {
  MetaDisplayValue,
} from "@/app/lib/definitions/interfaces/meta/PageMeta";

const representativeValue: Record<FieldType, MetaDisplayValue> = {
  [FieldType.integer]: 1,
  [FieldType.string]: "sample",
  [FieldType.boolean]: true,
  [FieldType.array]: [1, 2],
};

/**
 * Structural invariants every `PageMeta` declaration must hold (TD-40).
 *
 * Not `.testkit.ts` test files themselves — imported by one `describe` block
 * per domain meta object. The failure mode this guards against is a missing
 * or wrong declaration (no validator, an empty option list, a `getDatum` that
 * throws on the shape it is actually given), not a specific field's business
 * behaviour, which is why this is one assertion per invariant across every
 * field rather than one test per field.
 */
export function describePageMetaInvariants(
  suiteName: string,
  meta: Record<string, PageMeta>
) {
  describe.each(Object.entries(meta))(`${suiteName} > %s`, (_key, field) => {
    it("declares a validator", () => {
      expect(typeof field.validator.safeParse).toBe("function");
    });

    it("declares a non-empty option list when rendered as a select", () => {
      if (
        field.controlType !== ControlType.Select &&
        field.controlType !== ControlType.Multiselect
      ) {
        return;
      }
      expect(field.options?.length ?? 0).toBeGreaterThan(0);
    });

    it("getDatum does not throw on a representative value", () => {
      if (!field.getDatum) return;
      expect(() =>
        field.getDatum!(representativeValue[field.fieldType])
      ).not.toThrow();
    });
  });
}
