import { describe, expect, it } from "vitest";
import { z } from "zod";

import PageMeta from "./PageMeta";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";

describe("PageMeta's OptionsDeclaration (SPEC-006 T5)", () => {
  it("accepts a static options list with no optionTable", () => {
    const field: PageMeta = {
      metaField: "example",
      controlType: ControlType.Select,
      fieldType: FieldType.integer,
      defaultValue: 1,
      validator: z.number(),
      options: [{ value: 1, labelKey: "common.example" }],
    };

    expect(field.options).toHaveLength(1);
  });

  it("accepts an optionTable with no static options", () => {
    const field: PageMeta = {
      metaField: "example",
      controlType: ControlType.Select,
      fieldType: FieldType.integer,
      defaultValue: null,
      validator: z.number().int().nullable(),
      optionTable: "faction",
    };

    expect(field.optionTable).toBe("faction");
  });

  it("rejects declaring both, at compile time", () => {
    // @ts-expect-error — options and optionTable are mutually exclusive
    // (SPEC-006 §7). If this line ever stops erroring, the directive itself
    // becomes an "unused @ts-expect-error" error, so `pnpm typecheck` fails
    // either way.
    const field: PageMeta = {
      metaField: "example",
      controlType: ControlType.Select,
      fieldType: FieldType.integer,
      defaultValue: 1,
      validator: z.number(),
      options: [{ value: 1, labelKey: "common.example" }],
      optionTable: "faction",
    };

    expect(field).toBeDefined();
  });
});
