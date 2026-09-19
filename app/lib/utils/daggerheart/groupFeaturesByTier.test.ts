import { describe, expect, it } from "vitest";

import groupFeaturesByTier from "./groupFeaturesByTier";

// Invented names only (SPEC-018 §5): no rules content in tests.
const feature = (id: number, tier: string, position: number) => ({
  id,
  tier,
  position,
  name: `Feature ${id}`,
});

describe("groupFeaturesByTier (SPEC-021 T5)", () => {
  it("groups foundation, specialization, mastery, in that order", () => {
    const groups = groupFeaturesByTier([
      feature(1, "mastery", 1),
      feature(2, "foundation", 1),
      feature(3, "specialization", 1),
    ]);

    expect(groups.map(([tier]) => tier)).toEqual([
      "foundation",
      "specialization",
      "mastery",
    ]);
    expect(groups.map(([, rows]) => rows.map((row) => row.id))).toEqual([
      [2],
      [3],
      [1],
    ]);
  });

  it("orders each tier by position, not by input order", () => {
    const groups = groupFeaturesByTier([
      feature(1, "foundation", 3),
      feature(2, "foundation", 1),
      feature(3, "foundation", 2),
    ]);

    expect(groups[0]?.[1].map((row) => row.id)).toEqual([2, 3, 1]);
  });

  it("keeps an empty tier as an empty group", () => {
    const groups = groupFeaturesByTier([feature(1, "foundation", 1)]);

    expect(groups[1]).toEqual(["specialization", []]);
    expect(groups[2]).toEqual(["mastery", []]);
  });

  it("leaves out a feature whose tier is outside the vocabulary", () => {
    const groups = groupFeaturesByTier([feature(1, "legendary", 1)]);

    expect(groups.flatMap(([, rows]) => rows)).toEqual([]);
  });
});
