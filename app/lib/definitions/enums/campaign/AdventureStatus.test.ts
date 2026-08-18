import { z } from "zod";
import { describe, expect, it } from "vitest";

import AdventureStatus from "./AdventureStatus";

/**
 * `AdventureStatus` is stored directly as `adventure.status`'s raw `String`
 * value (SPEC-013 §6) — same reasoning as `SceneKind.test.ts`: `z.nativeEnum`
 * is the membership check, not an options-array validator.
 */
describe("AdventureStatus membership validator", () => {
  const validator = z.nativeEnum(AdventureStatus);

  it.each(Object.values(AdventureStatus))(
    "accepts the valid member %s",
    (status) => {
      expect(validator.safeParse(status).success).toBe(true);
    }
  );

  it("rejects a string outside the three statuses", () => {
    expect(validator.safeParse("abandoned").success).toBe(false);
  });

  it("rejects a non-string value", () => {
    expect(validator.safeParse(1).success).toBe(false);
  });
});
