import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhDomainCard: { update } },
}));

import updateDhDomainCard from "./updateDhDomainCard";

const payload = (change: Partial<DhDomainCard>) =>
  ({ id: 5, ...change }) as DhDomainCard;

describe("updateDhDomainCard (SPEC-021 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      updateDhDomainCard(payload({ cardLevel: 3 }))
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(update).not.toHaveBeenCalled();
  });

  it("writes only the fields the payload carries", async () => {
    const result = await updateDhDomainCard(payload({ cardLevel: 3 }));

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { cardLevel: 3 },
    });
  });

  it("refuses a level out of range with a field error", async () => {
    const result = await updateDhDomainCard(payload({ cardLevel: 12 }));

    expect(!result.ok && result.errors.cardLevel).toBeDefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a negative recall cost with a field error", async () => {
    const result = await updateDhDomainCard(payload({ recallCost: -2 }));

    expect(!result.ok && result.errors.recallCost).toBeDefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("ignores the card's joined domain in an edit payload", async () => {
    await updateDhDomainCard({
      ...payload({ name: "Lantern Step" }),
      domain: { id: 3, name: "Veilwright", colour: "teal" },
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { name: "Lantern Step" },
    });
  });
});
