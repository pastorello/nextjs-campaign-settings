import { describe, expect, it } from "vitest";

import {
  humanCountFixture as human,
  universalCountFixture as universal,
} from "./dateSystemFixtures";
import {
  DISPLAY_DATE_SYSTEM_COOKIE,
  parseDisplayDateSystemId,
  serializeDisplayDateSystemCookie,
} from "./displayDateSystemCookie";
import { resolveDisplayDateSystem } from "./resolveDisplayDateSystem";

describe("the per-viewer date system (SPEC-014 §5.2, T4)", () => {
  it("round-trips a system id through the cookie", () => {
    const cookie = serializeDisplayDateSystemCookie(2);
    expect(cookie.startsWith(`${DISPLAY_DATE_SYSTEM_COOKIE}=2;`)).toBe(true);
    expect(cookie).toContain("Path=/");
    expect(parseDisplayDateSystemId("2")).toBe(2);
  });

  it("reads an absent or malformed cookie as no preference", () => {
    for (const value of [undefined, "", "abc", "-1", "0", "2.5"]) {
      expect(parseDisplayDateSystemId(value)).toBeNull();
    }
  });

  it("uses the viewer's choice when it still exists", () => {
    expect(resolveDisplayDateSystem([universal, human], human.id)).toBe(human);
  });

  it("falls back to the world default for no or a stale preference", () => {
    const humanDefault = { ...human, isDefault: true };
    const plainUniversal = { ...universal, isDefault: false };
    const systems = [plainUniversal, humanDefault];

    expect(resolveDisplayDateSystem(systems, null)).toBe(humanDefault);
    expect(resolveDisplayDateSystem(systems, 99)).toBe(humanDefault);
  });

  it("falls back to the universal count when no row is the default", () => {
    const systems = [{ ...human }, { ...universal, isDefault: false }];
    expect(resolveDisplayDateSystem(systems, null)?.isUniversal).toBe(true);
    expect(resolveDisplayDateSystem([], null)).toBeUndefined();
  });
});
