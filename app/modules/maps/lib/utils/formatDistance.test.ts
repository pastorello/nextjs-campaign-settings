import { describe, expect, it } from "vitest";
import { formatMeters } from "./formatDistance";

describe("formatMeters", () => {
  it("formats sub-kilometre figures in metres", () => {
    expect(formatMeters(1.5, "it")).toBe("1,5 m");
    expect(formatMeters(1.5, "en")).toBe("1.5 m");
    expect(formatMeters(30, "it")).toBe("30 m");
  });

  it("switches to kilometres from 1000 m up", () => {
    expect(formatMeters(1000, "it")).toBe("1 km");
    expect(formatMeters(1500, "it")).toBe("1,5 km");
    expect(formatMeters(9000, "en")).toBe("9 km");
  });

  it("formats the legend's totals — a whole map at the kingdom scale", () => {
    // 36 squares × 9 km (§5's own example: "324 × 216 km").
    expect(formatMeters(324000, "it")).toBe("324 km");
    expect(formatMeters(216000, "en")).toBe("216 km");
  });

  it("rounds to at most one decimal, in the locale's own notation", () => {
    expect(formatMeters(1234, "it")).toBe("1,2 km");
    expect(formatMeters(1234, "en")).toBe("1.2 km");
  });
});
