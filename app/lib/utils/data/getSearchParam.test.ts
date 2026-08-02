import { describe, expect, it } from "vitest";

import getSearchParam from "./getSearchParam";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

describe("getSearchParam", () => {
  it("returns null for a field with no declared meta", () => {
    expect(getSearchParam("not-a-real-field", "1")).toBeNull();
  });

  it("returns null when the value is not a valid string", () => {
    expect(getSearchParam(SpellMetaField.name, null)).toBeNull();
    expect(getSearchParam(SpellMetaField.name, "")).toBeNull();
  });

  it("parses an integer field", () => {
    expect(getSearchParam(SpellMetaField.level, "3")).toBe(3);
  });

  it("parses an array field from its serialized form", () => {
    expect(getSearchParam(SpellMetaField.circle, "[1,2]")).toEqual([2, 1]);
  });

  it("falls back to a bare integer when the array field isn't serialized", () => {
    expect(getSearchParam(SpellMetaField.circle, "5")).toBe(5);
  });

  it("passes a string field through unchanged", () => {
    expect(getSearchParam(SpellMetaField.name, "Fireball")).toBe("Fireball");
  });

  it("coerces a boolean field to a real boolean", () => {
    expect(getSearchParam(SpellMetaField.ritual, "true")).toBe(true);
    expect(getSearchParam(SpellMetaField.ritual, "false")).toBe(true);
  });
});
