import { describe, expect, it } from "vitest";

import { formatGold, splitGold } from "./gold";

const label = (unit: string, count: number) => `${count} ${unit}`;

describe("splitGold (SPEC-030 T4)", () => {
  it("splits handfuls into chests, bags and handfuls at 10 : 1", () => {
    expect(splitGold(123)).toEqual({ chests: 1, bags: 2, handfuls: 3 });
    expect(splitGold(10)).toEqual({ chests: 0, bags: 1, handfuls: 0 });
    expect(splitGold(0)).toEqual({ chests: 0, bags: 0, handfuls: 0 });
  });
});

describe("formatGold (SPEC-030 T4)", () => {
  it("names only the denominations present", () => {
    expect(formatGold(120, label)).toBe("1 chests, 2 bags");
    expect(formatGold(7, label)).toBe("7 handfuls");
  });

  it("reads no gold as 0 handfuls, and keeps a negative's sign", () => {
    expect(formatGold(0, label)).toBe("0 handfuls");
    expect(formatGold(-15, label)).toBe("−1 bags, 5 handfuls");
  });
});
