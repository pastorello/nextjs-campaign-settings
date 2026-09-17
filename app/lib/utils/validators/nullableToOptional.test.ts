import { describe, expect, it } from "vitest";
import { z } from "zod";

import nullableToOptional from "./nullableToOptional";

describe("nullableToOptional (TD-130)", () => {
  it("turns null into undefined", () => {
    const schema = nullableToOptional(z.string().optional());
    const result = schema.safeParse(null);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it("leaves undefined as undefined", () => {
    const schema = nullableToOptional(z.string().optional());
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it("passes a real value through to the wrapped schema", () => {
    const schema = nullableToOptional(z.string().optional());
    const result = schema.safeParse("hello");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("hello");
  });

  it("still applies the wrapped schema's own rules", () => {
    // `.min(1)` — the shape `zoneMeta.description` uses to refuse "" while
    // still accepting null/undefined as "no description".
    const schema = nullableToOptional(z.string().min(1).optional());

    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(null).success).toBe(true);
  });
});
