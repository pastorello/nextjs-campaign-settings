import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findUnique, findMany } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhClass: { findUnique },
    dhDomainCard: { findMany },
  },
}));

import fetchDhClassPage from "./fetchDhClassPage";

// Invented content only (SPEC-018 §5): no SRD names or text.
const domainA = { id: 3, name: "Veilwright", colour: "violet", image: null };
const domainB = { id: 4, name: "Emberroot", colour: "amber", image: null };

const classRow = {
  id: 7,
  name: "Lamplighter",
  description: "<p>Keeps the roads lit.</p>",
  domainAId: 3,
  domainBId: 4,
  startingEvasion: 10,
  startingHp: 6,
  classItems: null,
  hopeFeatureName: "Kindle",
  hopeFeatureText: "<p>Light a lamp.</p>",
  origin: "homebrew",
  domainA,
  domainB,
  features: [
    { id: 1, classId: 7, position: 1, name: "Wick", text: "<p>A</p>" },
  ],
  subclasses: [
    {
      id: 11,
      classId: 7,
      name: "Glass Warden",
      description: null,
      spellcastTrait: null,
      origin: "homebrew",
      features: [
        {
          id: 21,
          subclassId: 11,
          tier: "foundation",
          position: 1,
          name: "Pane",
          text: "<p>B</p>",
        },
      ],
    },
  ],
};

const cardRow = {
  id: 31,
  name: "Lantern Step",
  domainId: 3,
  cardLevel: 1,
  recallCost: 0,
  cardType: "spell",
  featureText: "<p>C</p>",
  origin: "homebrew",
  domain: domainA,
};

describe("fetchDhClassPage (SPEC-021 T6)", () => {
  beforeEach(() => {
    findUnique.mockReset();
    findMany.mockReset();
    findUnique.mockResolvedValue(classRow);
    findMany.mockResolvedValue([cardRow]);
  });

  it("returns null, and reads no cards, when the class does not exist", async () => {
    findUnique.mockResolvedValue(null);

    expect(await fetchDhClassPage(99)).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("reads the cards of both of the class's domains, by level", async () => {
    await fetchDhClassPage(7);

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { domainId: { in: [3, 4] } },
      orderBy: [{ cardLevel: "asc" }, { domainId: "asc" }, { name: "asc" }],
    });
  });

  it("keeps the features the result schemas would strip", async () => {
    const page = await fetchDhClassPage(7);

    expect(page?.dhClass.features.map((f) => f.name)).toEqual(["Wick"]);
    expect(page?.subclasses[0]?.features.map((f) => f.name)).toEqual(["Pane"]);
  });

  it("returns the two domains in order, and a stored null trait as none", async () => {
    const page = await fetchDhClassPage(7);

    expect(page?.domains.map((d) => d.name)).toEqual([
      "Veilwright",
      "Emberroot",
    ]);
    expect(page?.subclasses[0]?.spellcastTrait).toBe("none");
    expect(page?.cards[0]?.domain.name).toBe("Veilwright");
  });

  it("throws a DatabaseError instead of returning a malformed card", async () => {
    findMany.mockResolvedValue([{ ...cardRow, cardLevel: "one" }]);

    await expect(fetchDhClassPage(7)).rejects.toBeInstanceOf(DatabaseError);
  });
});
