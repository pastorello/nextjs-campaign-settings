import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { findUnique, count, del } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  count: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhClassFeature: { findUnique, count, delete: del } },
}));

import deleteDhClassFeatureById from "./deleteDhClassFeatureById";

describe("deleteDhClassFeatureById (SPEC-021 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ id: 8, classId: 3 });
    del.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(deleteDhClassFeatureById(8)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes a feature when the class keeps another", async () => {
    count.mockResolvedValue(2);

    const result = await deleteDhClassFeatureById(8);

    expect(result).toEqual({ ok: true });
    expect(count).toHaveBeenCalledWith({ where: { classId: 3 } });
    expect(del).toHaveBeenCalledWith({ where: { id: 8 } });
  });

  it("refuses to delete the class's last feature", async () => {
    count.mockResolvedValue(1);

    const result = await deleteDhClassFeatureById(8);

    expect(result).toEqual({
      ok: false,
      errors: { id: [{ key: "classNeedsFeature" }] },
    });
    expect(del).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a missing feature", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deleteDhClassFeatureById(8)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
