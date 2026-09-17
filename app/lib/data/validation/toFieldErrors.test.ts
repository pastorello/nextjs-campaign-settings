import { describe, expect, it } from "vitest";
import { z } from "zod";

import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
import toFieldErrors from "./toFieldErrors";

function errorsOf(schema: z.ZodType, input: unknown) {
  const parsed = schema.safeParse(input);
  if (parsed.success) throw new Error("expected the parse to fail");
  return toFieldErrors(parsed.error);
}

describe("toFieldErrors (TD-124)", () => {
  it("never passes Zod's English default message through", () => {
    const errors = errorsOf(z.object({ title: z.string() }), {});

    expect(errors).toEqual({ title: [{ key: "invalidType" }] });
  });

  it("maps string length bounds to tooShort / tooLong with the bound", () => {
    const schema = z.object({ a: z.string().min(3), b: z.string().max(2) });

    expect(errorsOf(schema, { a: "x", b: "xyz" })).toEqual({
      a: [{ key: "tooShort", values: { minimum: 3 } }],
      b: [{ key: "tooLong", values: { maximum: 2 } }],
    });
  });

  it("tells inclusive from exclusive numeric bounds", () => {
    const schema = z.object({
      min: z.number().min(1),
      gt: z.number().gt(0),
      max: z.number().max(10),
      lt: z.number().lt(10),
    });

    expect(errorsOf(schema, { min: 0, gt: 0, max: 11, lt: 10 })).toEqual({
      min: [{ key: "tooSmall", values: { minimum: 1 } }],
      gt: [{ key: "tooSmallExclusive", values: { minimum: 0 } }],
      max: [{ key: "tooBig", values: { maximum: 10 } }],
      lt: [{ key: "tooBigExclusive", values: { maximum: 10 } }],
    });
  });

  it("maps array bounds to item counts", () => {
    const schema = z.object({
      few: z.array(z.number()).min(1),
      many: z.array(z.number()).max(1),
    });

    expect(errorsOf(schema, { few: [], many: [1, 2] })).toEqual({
      few: [{ key: "tooFewItems", values: { minimum: 1 } }],
      many: [{ key: "tooManyItems", values: { maximum: 1 } }],
    });
  });

  it("maps enum, format and multiple-of failures", () => {
    const schema = z.object({
      pick: z.enum(["a", "b"]),
      mail: z.email(),
      step: z.number().multipleOf(5),
    });

    expect(errorsOf(schema, { pick: "c", mail: "nope", step: 7 })).toEqual({
      pick: [{ key: "invalidOption" }],
      mail: [{ key: "invalidFormat" }],
      step: [{ key: "notMultipleOf", values: { divisor: 5 } }],
    });
  });

  it("passes a schema's own catalogue key through as the message", () => {
    const schema = z
      .object({ a: z.number().nullable(), b: z.number().nullable() })
      .refine((data) => !(data.a !== null && data.b !== null), {
        message: "lootLinksBoth" satisfies FieldErrorKey,
        path: ["b"],
      });

    expect(errorsOf(schema, { a: 1, b: 2 })).toEqual({
      b: [{ key: "lootLinksBoth" }],
    });
  });

  it("falls back to a generic key for a custom message that is not a key", () => {
    const schema = z.object({
      a: z.string().refine(() => false, { message: "Some English prose" }),
    });

    expect(errorsOf(schema, { a: "x" })).toEqual({ a: [{ key: "invalid" }] });
  });

  it("groups by the first path segment and drops path-less issues, as flatten() did", () => {
    const schema = z
      .object({ list: z.array(z.string()) })
      .refine(() => false, { message: "form-level" });

    const errors = errorsOf(schema, { list: ["ok", 1, 2] });

    expect(errors).toEqual({
      list: [{ key: "invalidType" }, { key: "invalidType" }],
    });
  });
});
