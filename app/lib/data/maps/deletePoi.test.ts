import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// `vi.hoisted` — see createPoi.test.ts for why a plain top-level `const`
// doesn't work here, and why this avoids `vi.mocked(prisma.poi.x)`.
const { findUnique, del } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { poi: { findUnique, delete: del } },
}));

import deletePoi from "./deletePoi";

describe("deletePoi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("deletes an existing POI", async () => {
    findUnique.mockResolvedValue({ id: 1 });
    del.mockResolvedValue({});

    await deletePoi(1);

    expect(del).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("throws NotFoundError for a missing POI without deleting", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deletePoi(999)).rejects.toBeInstanceOf(NotFoundError);
    expect(del).not.toHaveBeenCalled();
  });
});
