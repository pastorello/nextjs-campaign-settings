import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { searchAllDomains } = vi.hoisted(() => ({
  searchAllDomains: vi.fn(),
}));
vi.mock("./searchAllDomains", () => ({ default: searchAllDomains }));

import searchRecordLinks from "./searchRecordLinks";

describe("searchRecordLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("throws UnauthorizedError and never searches without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(searchRecordLinks("mira", "dnd5e")).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(searchAllDomains).not.toHaveBeenCalled();
  });

  it("runs the cross-entity search for the trimmed term and route system", async () => {
    const result = { npc: { total: 1, items: [{ id: 4, name: "Mira" }] } };
    searchAllDomains.mockResolvedValue(result);

    await expect(searchRecordLinks("  mira ", "dnd5e")).resolves.toBe(result);
    expect(searchAllDomains).toHaveBeenCalledWith("mira", "dnd5e");
  });

  it("rejects an unknown system and an oversized term", async () => {
    await expect(searchRecordLinks("mira", "pf2")).rejects.toThrow();
    await expect(searchRecordLinks("x".repeat(201), "dnd5e")).rejects.toThrow();
    expect(searchAllDomains).not.toHaveBeenCalled();
  });
});
