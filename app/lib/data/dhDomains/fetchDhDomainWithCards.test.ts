import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhDomain: { findUnique } },
}));

import fetchDhDomainWithCards from "./fetchDhDomainWithCards";

// Invented content only (SPEC-018 §5).
const card = {
  id: 31,
  name: "Lantern Step",
  domainId: 3,
  cardLevel: 1,
  recallCost: 0,
  cardType: "spell",
  featureText: "<p>C</p>",
  origin: "homebrew",
};
const row = {
  id: 3,
  name: "Veilwright",
  description: null,
  colour: "violet",
  origin: "homebrew",
  imageId: null,
  image: null,
  cards: [card],
};

describe("fetchDhDomainWithCards (SPEC-021 T2)", () => {
  beforeEach(() => {
    findUnique.mockReset();
    findUnique.mockResolvedValue(row);
  });

  it("reads the domain with its cards by level, then name", async () => {
    await fetchDhDomainWithCards(3);

    expect(findUnique.mock.calls[0]?.[0]).toMatchObject({
      where: { id: 3 },
      include: {
        cards: { orderBy: [{ cardLevel: "asc" }, { name: "asc" }] },
      },
    });
  });

  it("gives each card the domain its card view draws", async () => {
    const result = await fetchDhDomainWithCards(3);

    expect(result?.domain.name).toBe("Veilwright");
    expect(result?.cards[0]?.domain).toEqual({
      id: 3,
      name: "Veilwright",
      colour: "violet",
      image: null,
    });
  });

  it("returns null when there is no such domain", async () => {
    findUnique.mockResolvedValue(null);

    expect(await fetchDhDomainWithCards(99)).toBeNull();
  });

  it("throws a DatabaseError for a malformed domain or card", async () => {
    findUnique.mockResolvedValue({ ...row, colour: 4 });
    await expect(fetchDhDomainWithCards(3)).rejects.toBeInstanceOf(
      DatabaseError
    );

    findUnique.mockResolvedValue({
      ...row,
      cards: [{ ...card, cardLevel: "x" }],
    });
    await expect(fetchDhDomainWithCards(3)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });

  it("wraps a failed query", async () => {
    findUnique.mockRejectedValue(new Error("down"));

    await expect(fetchDhDomainWithCards(3)).rejects.toThrow(
      /fetching domain with its cards/
    );
  });
});
