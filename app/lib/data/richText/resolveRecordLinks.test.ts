import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { fetchResolution } = vi.hoisted(() => ({
  fetchResolution: vi.fn(),
}));
vi.mock("./fetchRecordLinkResolution", () => ({ default: fetchResolution }));

import resolveRecordLinks from "./resolveRecordLinks";

describe("resolveRecordLinks (SPEC-019 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("throws UnauthorizedError and never reads without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      resolveRecordLinks(["<p>x</p>"], "dnd5e")
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(fetchResolution).not.toHaveBeenCalled();
  });

  it("resolves the values under the route system", async () => {
    const result = { targets: { "npc:4": "Mira" }, deleted: [] };
    fetchResolution.mockResolvedValue(result);

    await expect(resolveRecordLinks(["<p>x</p>", null], "dnd5e")).resolves.toBe(
      result
    );
    expect(fetchResolution).toHaveBeenCalledWith(["<p>x</p>", null], "dnd5e");
  });

  it("rejects an unknown system and too many values", async () => {
    await expect(resolveRecordLinks([], "pf2")).rejects.toThrow();
    await expect(
      resolveRecordLinks(Array<string>(21).fill("x"), "dnd5e")
    ).rejects.toThrow();
    expect(fetchResolution).not.toHaveBeenCalled();
  });
});
