import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { update, findUnique } = vi.hoisted(() => ({
  update: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { update, findUnique } },
}));

import setCampaignCurrentDay from "./setCampaignCurrentDay";

describe("setCampaignCurrentDay (SPEC-014 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ id: 1 });
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      setCampaignCurrentDay(1, { currentDay: 10 })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(update).not.toHaveBeenCalled();
  });

  it("sets the current day", async () => {
    const result = await setCampaignCurrentDay(1, { currentDay: 2_100_000 });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { currentDay: 2_100_000 },
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[locale]/dashboard/[system]/campaign/calendar",
      "page"
    );
  });

  it("clears it with null", async () => {
    await setCampaignCurrentDay(1, { currentDay: null });

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { currentDay: null },
    });
  });

  it("refuses a day before the dawn of time with a field error", async () => {
    const result = await setCampaignCurrentDay(1, { currentDay: -1 });

    expect(result).toEqual({
      ok: false,
      errors: { currentDay: [{ key: "beforeDawnOfTime" }] },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("is not found for a campaign that does not exist", async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      setCampaignCurrentDay(9, { currentDay: 10 })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(update).not.toHaveBeenCalled();
  });
});
