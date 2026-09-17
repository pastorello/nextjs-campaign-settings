// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// proxy.ts pulls in next-intl/middleware and next-auth/jwt, whose ESM builds
// don't resolve under Vitest's module graph, so both are stubbed. The intl
// stub passes every request through (status 200), which is what next-intl
// does for a path it only rewrites; `token` decides the auth gate.
let token: object | null = null;
vi.mock("next-intl/middleware", () => ({
  default: () => () => new Response(null, { status: 200 }),
}));
vi.mock("next-auth/jwt", () => ({ getToken: () => token }));
process.env.AUTH_SECRET ??= "test-secret";

const { config, default: proxy, systemRedirectPath } = await import("./proxy");

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

  it("gates the cross-entity search page like any other dashboard route (SPEC-011 T3)", () => {
    expect(matcher.test("/dashboard/search")).toBe(true);
  });
});

describe("systemRedirectPath (ADR-0013 rule 3)", () => {
  it.each([
    ["/dashboard", "/dashboard/dnd5e"],
    ["/dashboard/spells", "/dashboard/dnd5e/spells"],
    ["/dashboard/admin/spells/new", "/dashboard/dnd5e/admin/spells/new"],
    ["/en/dashboard", "/en/dashboard/dnd5e"],
    ["/en/dashboard/geography", "/en/dashboard/dnd5e/geography"],
    // An unknown system is kept as a path segment, so it ends in a 404.
    ["/dashboard/foo/spells", "/dashboard/dnd5e/foo/spells"],
    ["/en/dashboard/foo", "/en/dashboard/dnd5e/foo"],
  ])("inserts the default system: %s → %s", (from, to) => {
    expect(systemRedirectPath(from)).toBe(to);
  });

  it.each([
    "/dashboard/dnd5e",
    "/dashboard/dnd5e/spells",
    "/en/dashboard/dnd5e/admin/npc",
    "/",
    "/login",
    "/en/login",
    "/en",
    // Only the `/dashboard` segment itself, not a path that starts with it.
    "/dashboards",
  ])("leaves %s alone", (path) => {
    expect(systemRedirectPath(path)).toBeNull();
  });
});

describe("proxy", () => {
  beforeEach(() => {
    token = { sub: "1" };
  });

  function run(url: string) {
    return proxy(new NextRequest(`http://localhost:3000${url}`));
  }

  it.each([
    [
      "/dashboard/spells?query=fire&page=2",
      "/dashboard/dnd5e/spells?query=fire&page=2",
    ],
    [
      "/en/dashboard/spells?query=fire",
      "/en/dashboard/dnd5e/spells?query=fire",
    ],
    ["/dashboard/geography", "/dashboard/dnd5e/geography"],
    ["/en/dashboard", "/en/dashboard/dnd5e"],
    ["/dashboard/foo/spells", "/dashboard/dnd5e/foo/spells"],
  ])("307s %s to %s, keeping the query", async (from, to) => {
    const response = await run(from);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`http://localhost:3000${to}`);
  });

  it("does not redirect a path that already names a system", async () => {
    const response = await run("/en/dashboard/dnd5e/spells?query=fire");
    expect(response.status).toBe(200);
  });

  // The login redirect's callbackUrl must name a system: sign-in redirects
  // from a Server Action, which does not surface this proxy's 307 in the
  // address bar.
  it("inserts the system before the auth gate, so the login callback carries it", async () => {
    token = null;
    const legacy = await run("/dashboard/spells");
    expect(legacy.headers.get("location")).toBe(
      "http://localhost:3000/dashboard/dnd5e/spells"
    );

    const response = await run("/dashboard/dnd5e/spells");
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe(
      "http://localhost:3000/dashboard/dnd5e/spells"
    );
  });
});
