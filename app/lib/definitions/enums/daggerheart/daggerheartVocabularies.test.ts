import { z } from "zod";
import { describe, expect, it } from "vitest";

import DhDomainCardType from "./DhDomainCardType";
import DhOrigin from "./DhOrigin";
import DhSpellcastTrait from "./DhSpellcastTrait";
import DhSubclassFeatureTier from "./DhSubclassFeatureTier";

/**
 * SPEC-021's string vocabularies are stored as raw `String` columns, like
 * `scene.kind`, so `z.nativeEnum` is the membership check the metadata
 * validators will use (T2–T5). These pin the stored values: a renamed member
 * value would orphan every row already written with the old one.
 */
describe.each([
  ["DhOrigin", DhOrigin, ["homebrew", "srdReference"]],
  ["DhDomainCardType", DhDomainCardType, ["ability", "spell", "grimoire"]],
  [
    "DhSubclassFeatureTier",
    DhSubclassFeatureTier,
    ["foundation", "specialization", "mastery"],
  ],
  [
    "DhSpellcastTrait",
    DhSpellcastTrait,
    ["agility", "strength", "finesse", "instinct", "presence", "knowledge"],
  ],
] as const)("%s", (_name, vocabulary, stored) => {
  const validator = z.nativeEnum(vocabulary);

  it("stores exactly the spec's values", () => {
    expect(Object.values(vocabulary)).toEqual(stored);
  });

  it("rejects anything else", () => {
    expect(validator.safeParse("other").success).toBe(false);
    expect(validator.safeParse("").success).toBe(false);
    expect(validator.safeParse(0).success).toBe(false);
  });

  it("accepts every member", () => {
    for (const value of stored)
      expect(validator.safeParse(value).success).toBe(true);
  });
});
