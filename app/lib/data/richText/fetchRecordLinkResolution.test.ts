import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchTargets, inSystem } = vi.hoisted(() => ({
  fetchTargets: vi.fn(),
  inSystem: vi.fn(),
}));

vi.mock("./fetchRecordLinkTargets", () => ({ default: fetchTargets }));
vi.mock("@/app/lib/data/search/searchAllDomains", () => ({
  isSearchDomainInSystem: inSystem,
}));

import fetchRecordLinkResolution from "./fetchRecordLinkResolution";

const link = (domain: string, id: number) =>
  `<a data-record-domain="${domain}" data-record-id="${id}">x</a>`;

describe("fetchRecordLinkResolution (SPEC-019 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inSystem.mockReturnValue(true);
  });

  it("reports the in-system links that did not resolve as deleted", async () => {
    const values = [
      `<p>${link("npc", 1)} ${link("npc", 2)}</p>`,
      "plain",
      null,
    ];
    fetchTargets.mockResolvedValue({ "npc:1": "Mira" });
    await expect(fetchRecordLinkResolution(values, "dnd5e")).resolves.toEqual({
      targets: { "npc:1": "Mira" },
      deleted: ["npc:2"],
    });
    expect(fetchTargets).toHaveBeenCalledWith(values, "dnd5e");
  });

  it("never reports a link outside the system as deleted", async () => {
    fetchTargets.mockResolvedValue({});
    inSystem.mockImplementation((domain: string) => domain !== "spells");
    await expect(
      fetchRecordLinkResolution([`<p>${link("spells", 3)}</p>`], "other")
    ).resolves.toEqual({ targets: {}, deleted: [] });
  });
});
