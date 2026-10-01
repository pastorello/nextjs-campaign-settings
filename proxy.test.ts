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
// The dashboard's fresh role check reads the database; `access` decides it.
let access: "dm" | "player" | "none" = "dm";
vi.mock("./app/lib/auth/dashboardAccess", () => ({
  default: () => Promise.resolve(access),
}));
// A player's campaigns' systems (SPEC-022 §8); null is no campaign.
let home: { systems: Set<string>; current: string } | null = null;
vi.mock("./app/lib/auth/playerSystems", () => ({
  default: () => Promise.resolve(home),
}));
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
    access = "dm";
    home = null;
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

  // SPEC-022 T1 (ADR-0020): refused here, before anything renders, since a
  // page's data renders in parallel with a layout that would refuse it.
  describe("a player's session", () => {
    beforeEach(() => {
      token = { sub: "1", role: "player" };
      access = "player";
    });

    it("is rewritten to the 403 page under the dashboard, keeping the URL", async () => {
      const response = await run("/dashboard/dnd5e/campaign");

      expect(response.headers.get("x-middleware-rewrite")).toBe(
        "http://localhost:3000/it/access-denied"
      );
      expect(response.headers.get("location")).toBeNull();
    });

    it("keeps the locale of the request", async () => {
      const response = await run("/en/dashboard/dnd5e/admin/npc");

      expect(response.headers.get("x-middleware-rewrite")).toBe(
        "http://localhost:3000/en/access-denied"
      );
    });

    // Signing out is a Server Action posted to the current page's URL.
    it("lets a Server Action through to guard itself", async () => {
      const response = await proxy(
        new NextRequest("http://localhost:3000/dashboard/dnd5e/npc", {
          method: "POST",
          headers: { "next-action": "abc123" },
        })
      );

      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    });

    it("rewrites a POST that is not a Server Action", async () => {
      const response = await proxy(
        new NextRequest("http://localhost:3000/dashboard/dnd5e/campaign", {
          method: "POST",
        })
      );

      expect(response.headers.get("x-middleware-rewrite")).toBe(
        "http://localhost:3000/it/access-denied"
      );
    });

    // SPEC-022 T7: the pages whose reads filter by the player's campaign.
    it.each([
      "/dashboard/dnd5e/geography",
      "/en/dashboard/daggerheart/geography",
      "/dashboard/dnd5e",
      "/dashboard/dnd5e/spells",
    ])("lets a player through to %s", async (path) => {
      const response = await run(path);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    });

    // SPEC-022 §8: signing in lands on the default system's overview.
    describe("landing on another system's overview", () => {
      beforeEach(() => {
        home = { systems: new Set(["daggerheart"]), current: "daggerheart" };
      });

      it.each([
        ["/dashboard/dnd5e", "http://localhost:3000/dashboard/daggerheart"],
        [
          "/en/dashboard/dnd5e",
          "http://localhost:3000/en/dashboard/daggerheart",
        ],
      ])("sends %s to the player's own system", async (path, target) => {
        const response = await run(path);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(target);
      });

      it("leaves the player's own system's overview alone", async () => {
        const response = await run("/dashboard/daggerheart");

        expect(response.headers.get("location")).toBeNull();
      });

      it("leaves another system's page to the layout's 404", async () => {
        const response = await run("/dashboard/dnd5e/spells");

        expect(response.headers.get("location")).toBeNull();
      });

      it("sends no player in no campaign anywhere", async () => {
        home = null;

        const response = await run("/dashboard/dnd5e");

        expect(response.headers.get("location")).toBeNull();
      });
    });

    it("is not refused outside the dashboard", async () => {
      const response = await run("/login");

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    });
  });

  // SPEC-022 T4: the DM sign-up is the second public page.
  it.each(["/signup", "/en/signup"])(
    "lets a signed-out request reach %s",
    async (path) => {
      token = null;

      const response = await run(path);

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
  );

  it("still sends a signed-out request elsewhere to the login page", async () => {
    token = null;

    const response = await run("/signup/extra");

    expect(response.status).toBe(307);
  });

  it("lets the DM through", async () => {
    const response = await run("/dashboard/dnd5e/admin/npc");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  // A token whose account was disabled or deleted after it signed in.
  it("sends a disabled account to the login page", async () => {
    access = "none";

    const response = await run("/en/dashboard/dnd5e/npc");

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/en/login");
    expect(location.searchParams.get("callbackUrl")).toBe(
      "http://localhost:3000/en/dashboard/dnd5e/npc"
    );
  });
});
