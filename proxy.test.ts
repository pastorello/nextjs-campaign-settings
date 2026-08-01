// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// proxy.ts pulls in next-intl/middleware and next-auth/jwt, whose ESM builds
// don't resolve under Vitest's module graph. Stubbing them out is enough
// because this test only exercises `config.matcher`, a plain string that
// never touches either import.
vi.mock("next-intl/middleware", () => ({ default: () => () => {} }));
vi.mock("next-auth/jwt", () => ({ getToken: () => null }));
process.env.AUTH_SECRET ??= "test-secret";

const { config } = await import("./proxy");

// The matcher is a plain string handed to Next.js, which turns it into a
// regex internally. Compiling it the same way here lets us assert against
// the actual pattern instead of a copy that could drift.
const matcher = new RegExp(`^${config.matcher[0]}$`);

describe("proxy matcher", () => {
  it("excludes png assets from the auth/i18n gate", () => {
    expect(matcher.test("/maps/skreebars.png")).toBe(false);
  });

  it("excludes jpg assets from the auth/i18n gate", () => {
    // Regression: the map tiles under public/maps/*.jpg were being routed
    // through the i18n middleware because the matcher only excluded .png,
    // which turned every tile request into a redirect/404 and left the
    // interactive map blank.
    expect(matcher.test("/maps/skreebars.jpg")).toBe(false);
  });

  it("still gates a real page route", () => {
    expect(matcher.test("/dashboard/geography")).toBe(true);
  });
});
