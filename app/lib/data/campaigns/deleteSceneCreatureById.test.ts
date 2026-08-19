import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { findUnique, del } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { sceneCreature: { findUnique, delete: del } },
}));

import deleteSceneCreatureById from "./deleteSceneCreatureById";

describe("deleteSceneCreatureById (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without deleting", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(deleteSceneCreatureById(1)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes an existing creature row", async () => {
    findUnique.mockResolvedValue({ id: 1 });
    del.mockResolvedValue({});

    await deleteSceneCreatureById(1);

    expect(del).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("throws NotFoundError for a missing creature row without deleting", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deleteSceneCreatureById(999)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(del).not.toHaveBeenCalled();
  });
});
