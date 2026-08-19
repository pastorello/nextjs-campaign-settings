import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { adventure: { update } },
}));

import updateAdventure from "./updateAdventure";

const validFormData: Adventure = {
  id: 7,
  campaignId: 1,
  position: 2,
  targetLevel: 4,
  title: "The Sunken Vault",
  synopsis: "A drowned tomb wakes.",
  timeline: "Midsummer",
  status: AdventureStatus.Active,
  xpTarget: 1200,
  currencyTarget: 600,
  currencyUnit: "gold",
  permanentItemTarget: 3,
  consumableTarget: 5,
};

describe("updateAdventure (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateAdventure(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the adventure on valid input", async () => {
    update.mockResolvedValue({});

    const result = await updateAdventure(validFormData);

    const { id, ...rest } = validFormData;
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ where: { id }, data: rest });
  });

  it("rejects a non-positive id, without writing", async () => {
    const result = await updateAdventure({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("allows repositioning an adventure explicitly", async () => {
    update.mockResolvedValue({});

    const result = await updateAdventure({ ...validFormData, position: 9 });

    expect(result).toEqual({ ok: true });
    const { id, ...rest } = validFormData;
    expect(update).toHaveBeenCalledWith({
      where: { id },
      data: { ...rest, position: 9 },
    });
  });

  it("rejects an out-of-range target level, without writing", async () => {
    const result = await updateAdventure({ ...validFormData, targetLevel: 0 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
