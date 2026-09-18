import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { remove, findUnique } = vi.hoisted(() => ({
  remove: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarEvent: { delete: remove, findUnique } },
}));

import deleteWorldHistoryEventById from "./deleteWorldHistoryEventById";

describe("deleteWorldHistoryEventById (SPEC-014 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ campaignId: null });
  });

  it("rejects an unauthenticated request without deleting", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(deleteWorldHistoryEventById(4)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("deletes a world history event", async () => {
    await deleteWorldHistoryEventById(4);

    expect(remove).toHaveBeenCalledWith({ where: { id: 4 } });
  });

  it("will not delete a campaign event", async () => {
    findUnique.mockResolvedValue({ campaignId: 1 });

    await expect(deleteWorldHistoryEventById(4)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(remove).not.toHaveBeenCalled();
  });

  it("reports a missing event as not found", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deleteWorldHistoryEventById(4)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
