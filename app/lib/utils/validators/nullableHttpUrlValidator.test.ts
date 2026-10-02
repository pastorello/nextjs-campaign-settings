import { describe, expect, it } from "vitest";

import nullableHttpUrlValidator, {
  HTTP_URL_MAX_LENGTH,
} from "./nullableHttpUrlValidator";

const validator = nullableHttpUrlValidator();

describe("nullableHttpUrlValidator (SPEC-031)", () => {
  it.each([
    "https://example.com/monsters/goblin",
    "http://localhost:3000/x",
    "https://example.com/a?b=1#c",
  ])("accepts %s", (url) => {
    expect(validator.safeParse(url)).toEqual({ success: true, data: url });
  });

  it.each(["", "   ", null])("reads %j as blank", (raw) => {
    expect(validator.safeParse(raw)).toEqual({ success: true, data: "" });
  });

  it("leaves a missing value missing", () => {
    expect(validator.safeParse(undefined)).toEqual({
      success: true,
      data: undefined,
    });
  });

  it("trims the address", () => {
    expect(validator.parse("  https://example.com  ")).toBe(
      "https://example.com"
    );
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<b>x</b>",
    "ftp://example.com/x",
    "mailto:dm@example.com",
    "example.com/monster",
    "Monster Manual, p. 123",
    "https://",
  ])("refuses %s", (url) => {
    expect(validator.safeParse(url).success).toBe(false);
  });

  it("refuses an address longer than the bound", () => {
    const long = `https://example.com/${"a".repeat(HTTP_URL_MAX_LENGTH)}`;
    expect(validator.safeParse(long).success).toBe(false);
  });
});
