import { describe, expect, it } from "vitest";

import resolveFieldValue from "./resolveFieldValue";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";

const t = (key: string) => key;

/**
 * `renderFieldValue.test.ts` already covers the options/getDatum/boolean
 * branches against real metadata. The one branch nothing in the app actually
 * reaches — every declared field has either `options`, a `getDatum`, or is a
 * boolean — is the final `String(value)` fallback, so it needs a stub meta.
 */
describe("resolveFieldValue", () => {
  it("falls back to String(value) when there is no options, getDatum, or boolean type", () => {
    const meta = {
      metaField: "raw",
      controlType: ControlType.Text,
      fieldType: FieldType.string,
      defaultValue: "",
    } as PageMeta;

    expect(resolveFieldValue(meta, 42, t)).toBe("42");
  });
});
