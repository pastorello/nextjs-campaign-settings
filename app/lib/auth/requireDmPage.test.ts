import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { forbidden, redirect } = vi.hoisted(() => ({
  forbidden: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;403");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("next/navigation", () => ({ forbidden }));
vi.mock("@/i18n/navigation", () => ({ redirect }));
vi.mock("next-intl/server", () => ({
  getLocale: () => Promise.resolve("en"),
}));

import requireDmPage from "./requireDmPage";

describe("requireDmPage (SPEC-022 T1)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lets the DM through", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", role: "dm" },
    } as never);

    await expect(requireDmPage()).resolves.toBeUndefined();
    expect(forbidden).not.toHaveBeenCalled();
  });

  it("answers a player with forbidden()", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "2", role: "player" },
    } as never);

    await expect(requireDmPage()).rejects.toThrow("403");
    expect(forbidden).toHaveBeenCalled();
  });

  // The proxy only decodes the token; `auth()` re-reads the row, so an
  // account disabled since it signed in arrives here with no session.
  it("sends a request with no session to the login page", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(requireDmPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith({ href: "/login", locale: "en" });
    expect(forbidden).not.toHaveBeenCalled();
  });
});
