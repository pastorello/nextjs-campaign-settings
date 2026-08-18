import { z } from "zod";
import { describe, expect, it } from "vitest";

import SceneKind from "./SceneKind";

/**
 * `SceneKind` is stored directly as `scene.kind`'s raw `String` value (SPEC-013
 * §6), so `z.nativeEnum` — not an options-array `optionValueValidator` — is
 * the membership check: a row read back is only a `string` as far as the
 * type system knows, and this is where it gets checked against the six
 * values the app actually recognises.
 */
describe("SceneKind membership validator", () => {
  const validator = z.nativeEnum(SceneKind);

  it.each(Object.values(SceneKind))("accepts the valid member %s", (kind) => {
    expect(validator.safeParse(kind).success).toBe(true);
  });

  it("rejects a string outside the six kinds", () => {
    expect(validator.safeParse("ambush").success).toBe(false);
  });

  it("rejects a non-string value", () => {
    expect(validator.safeParse(0).success).toBe(false);
  });
});
