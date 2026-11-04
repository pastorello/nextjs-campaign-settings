import { describe, expect, it } from "vitest";

import slugify from "./slugify";

describe("slugify (SPEC-033)", () => {
  it("joins lowercase words with dashes", () => {
    expect(slugify("Palla di Fuoco", "x")).toBe("palla-di-fuoco");
  });

  it("drops accents", () => {
    expect(slugify("Città d'Oltremare", "x")).toBe("citta-d-oltremare");
  });

  it("trims dashes from both ends", () => {
    expect(slugify("  --The Hand!--  ", "x")).toBe("the-hand");
  });

  it("caps the length without leaving a trailing dash", () => {
    const slug = slugify(`${"a".repeat(79)} b`, "x");

    expect(slug).toBe("a".repeat(79));
  });

  it("falls back when nothing is left", () => {
    expect(slugify("★★★", "record-7")).toBe("record-7");
    expect(slugify("火球", "record-7")).toBe("record-7");
  });
});
