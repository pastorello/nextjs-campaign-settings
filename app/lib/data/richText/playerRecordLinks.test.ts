import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    npc: { findMany: vi.fn() },
    zone: { findMany: vi.fn() },
    spells: { findMany: vi.fn() },
  },
}));
vi.mock("@/app/lib/connections/prisma", () => ({ default: db }));
vi.mock("@/auth", () => ({ auth: vi.fn() }));

import fetchRecordLinkResolution from "./fetchRecordLinkResolution";

const link = (domain: string, id: number) =>
  `<a data-record-domain="${domain}" data-record-id="${id}">x</a>`;
const values = [
  `<p>${link("npc", 1)} ${link("npc", 2)} ${link("places", 5)} ${link("places", 6)} ${link("spells", 7)}</p>`,
];

const scope = {
  kind: "campaign" as const,
  campaignId: 4,
  zones: new Set([5]),
  pois: new Set<number>(),
};

/** SPEC-022 T7 (R13): links in formatted text, under a player's scope. */
describe("record links for a player", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.npc.findMany.mockImplementation(
      (args: { where: { revealedTo?: unknown } }) =>
        Promise.resolve(
          args.where.revealedTo
            ? [{ id: 1 }]
            : [
                { id: 1, name: "Mira" },
                { id: 2, name: "The Veiled" },
              ]
        )
    );
    db.zone.findMany.mockResolvedValue([
      { id: 5, title: "Port" },
      { id: 6, title: "Hidden Vault" },
    ]);
    db.spells.findMany.mockResolvedValue([{ id: 7, name: "Lantern Step" }]);
  });

  it("resolves only what the campaign has been shown, and every rule", async () => {
    const { targets } = await fetchRecordLinkResolution(values, "dnd5e", scope);

    expect(targets).toEqual({
      "npc:1": "Mira",
      "places:5": "Port",
      "spells:7": "Lantern Step",
    });
  });

  it("never names the deleted links, which would tell the hidden ones apart", async () => {
    const { deleted } = await fetchRecordLinkResolution(values, "dnd5e", scope);

    expect(deleted).toEqual([]);
  });

  it("resolves nothing that is revealed one by one for a player in no campaign", async () => {
    const { targets } = await fetchRecordLinkResolution(values, "dnd5e", {
      ...scope,
      campaignId: null,
      zones: new Set(),
    });

    expect(targets).toEqual({ "spells:7": "Lantern Step" });
  });
});
