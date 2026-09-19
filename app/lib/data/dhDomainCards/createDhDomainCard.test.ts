import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import { Prisma } from "@/generated/prisma/client";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhDomainCard: { create } },
}));

import createDhDomainCard from "./createDhDomainCard";

// Invented content only (SPEC-018 §5): no SRD card names or text.
const validFormData: DhDomainCard = {
  id: 0,
  name: "Lantern Step",
  domainId: 3,
  cardLevel: 2,
  recallCost: 1,
  cardType: "spell",
  featureText: "<p>Step from one lit lantern to another you can see.</p>",
  origin: "homebrew",
};

describe("createDhDomainCard (SPEC-021 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    create.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhDomainCard(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the card on valid input, writing the level and type columns", async () => {
    const result = await createDhDomainCard(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Lantern Step",
        domainId: 3,
        cardLevel: 2,
        recallCost: 1,
        cardType: "spell",
        featureText: "<p>Step from one lit lantern to another you can see.</p>",
        origin: "homebrew",
      },
    });
  });

  it.each([
    ["a level below 1", { cardLevel: 0 }, "cardLevel"],
    ["a level above 10", { cardLevel: 11 }, "cardLevel"],
    ["a negative recall cost", { recallCost: -1 }, "recallCost"],
    ["an unknown type", { cardType: "trinket" }, "cardType"],
    ["no domain", { domainId: null }, "domainId"],
    ["empty feature text", { featureText: "" }, "featureText"],
    ["feature text with no words", { featureText: "<p></p>" }, "featureText"],
    ["an unknown origin", { origin: "borrowed" }, "origin"],
  ])(
    "refuses %s with a field error, writing nothing",
    async (_case, change, field) => {
      const result = await createDhDomainCard({
        ...validFormData,
        ...(change as Partial<DhDomainCard>),
      });

      expect(result.ok).toBe(false);
      expect(!result.ok && result.errors[field]).toBeDefined();
      expect(create).not.toHaveBeenCalled();
    }
  );

  it("coerces a recall cost typed as a string", async () => {
    await createDhDomainCard({
      ...validFormData,
      recallCost: "2" as unknown as number,
    });

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      data: { recallCost: 2 },
    });
  });

  it("names the domain field when the domain no longer exists", async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("fk", {
        code: "P2003",
        clientVersion: "test",
      })
    );

    const result = await createDhDomainCard(validFormData);

    expect(result).toEqual({
      ok: false,
      errors: { domainId: [{ key: "dhDomainNotFound" }] },
    });
  });
});
