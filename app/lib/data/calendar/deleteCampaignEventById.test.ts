import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { remove, findUnique } = vi.hoisted(() => ({
  remove: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarEvent: { delete: remove, findUnique } },
}));

import deleteCampaignEventById from "./deleteCampaignEventById";

describe("deleteCampaignEventById (SPEC-014 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ campaignId: 1 });
    remove.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without deleting", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(deleteCampaignEventById(5)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("deletes a campaign event", async () => {
    await deleteCampaignEventById(5);

    expect(remove).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[locale]/dashboard/[system]/campaign/calendar",
      "page"
    );
  });

  it("never deletes a world history event", async () => {
    findUnique.mockResolvedValue({ campaignId: null });

    await expect(deleteCampaignEventById(5)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(remove).not.toHaveBeenCalled();
  });
});
