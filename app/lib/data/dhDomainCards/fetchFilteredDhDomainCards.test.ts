import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhDomainCard: { findMany } },
}));

import { fetchFilteredDhDomainCards } from "./fetchFilteredDhDomainCards";

// Invented content only (SPEC-018 §5).
const row = {
  id: 1,
  name: "Lantern Step",
  domainId: 3,
  cardLevel: 2,
  recallCost: 1,
  cardType: "spell",
  featureText: "<p>Step between lanterns.</p>",
  origin: "homebrew",
  domain: { id: 3, name: "Veilwright", colour: "teal", image: null },
};

const whereOf = () =>
  (findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> }).where;

describe("fetchFilteredDhDomainCards (SPEC-021 T3)", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([row]);
  });

  it("filters by domain, level, type and origin from the header filters", async () => {
    await fetchFilteredDhDomainCards({
      domainId: "3",
      cardLevel: "2",
      cardType: "spell",
      origin: "srdReference",
    });

    expect(whereOf()).toEqual({
      domainId: 3,
      cardLevel: 2,
      cardType: "spell",
      origin: "srdReference",
    });
  });

  it("does not treat the rows/cards switch as a filter", async () => {
    await fetchFilteredDhDomainCards({ view: "cards" });

    expect(whereOf()).toEqual({});
  });

  it("reads each card's domain in the same query", async () => {
    await fetchFilteredDhDomainCards({});

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      include: {
        domain: {
          select: { id: true, name: true, colour: true, image: {} },
        },
      },
    });
  });

  it("returns the cards with their domain", async () => {
    const [card] = await fetchFilteredDhDomainCards({});

    expect(card?.cardLevel).toBe(2);
    expect(card?.domain).toEqual({
      id: 3,
      name: "Veilwright",
      colour: "teal",
      image: null,
    });
  });

  it("throws a DatabaseError instead of returning a malformed row", async () => {
    findMany.mockResolvedValue([{ ...row, cardLevel: "two" }]);

    await expect(fetchFilteredDhDomainCards({})).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
