import { describe, expect, it } from "vitest";

import { isUserRole } from "./UserRole";

describe("isUserRole", () => {
  it("accepts the two roles", () => {
    expect(isUserRole("dm")).toBe(true);
    expect(isUserRole("player")).toBe(true);
  });

  it("refuses anything else, including a differently cased role", () => {
    expect(isUserRole("DM")).toBe(false);
    expect(isUserRole("admin")).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
  });
});
