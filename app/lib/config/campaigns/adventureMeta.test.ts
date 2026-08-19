import { describe, expect, it } from "vitest";

import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";
import adventureMeta from "./adventureMeta";

describePageMetaInvariants("adventureMeta", adventureMeta);

describe("adventureMeta (SPEC-013 T4)", () => {
  it("rejects an empty title", () => {
    expect(adventureMeta.title.validator.safeParse("").success).toBe(false);
  });

  it("rejects a target level outside 1-20", () => {
    expect(adventureMeta.targetLevel.validator.safeParse(0).success).toBe(
      false
    );
    expect(adventureMeta.targetLevel.validator.safeParse(21).success).toBe(
      false
    );
  });

  it("accepts every AdventureStatus member and rejects an unknown one", () => {
    for (const status of Object.values(AdventureStatus)) {
      expect(adventureMeta.status.validator.safeParse(status).success).toBe(
        true
      );
    }
    expect(adventureMeta.status.validator.safeParse("abandoned").success).toBe(
      false
    );
  });

  it.each([
    "xpTarget",
    "currencyTarget",
    "permanentItemTarget",
    "consumableTarget",
  ] as const)(
    "treats an unset %s as no value, not zero — renders as em dash",
    (field) => {
      const parsed = adventureMeta[field].validator.safeParse("");
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toBeNull();
      }
      expect(adventureMeta[field].getDatum?.(null)).toBe("—");
    }
  );

  it("rejects a negative budget target", () => {
    expect(adventureMeta.xpTarget.validator.safeParse(-5).success).toBe(false);
  });

  it("accepts only silver or gold for currencyUnit", () => {
    expect(
      adventureMeta.currencyUnit.validator.safeParse("silver").success
    ).toBe(true);
    expect(
      adventureMeta.currencyUnit.validator.safeParse("copper").success
    ).toBe(false);
  });

  // T7 (`AdventureForm`) creates an adventure with only position, target
  // level and title set (§5.2) and — because `Adventure`'s domain interface
  // types every other field `string | null`, not optional — supplies these
  // three as an explicit `null` rather than omitting them. `.optional()`
  // alone only tolerates `undefined`; a real `createAdventure` call with a
  // bare-minimum adventure failed validation in the browser before this.
  it.each(["synopsis", "timeline"] as const)(
    "accepts a null %s, the same as an unset optional string column",
    (field) => {
      expect(adventureMeta[field].validator.safeParse(null).success).toBe(true);
    }
  );

  it("accepts a null currencyUnit, the same as an unset display choice", () => {
    expect(adventureMeta.currencyUnit.validator.safeParse(null).success).toBe(
      true
    );
  });
});
