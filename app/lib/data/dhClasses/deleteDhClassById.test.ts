import { beforeEach, describe, expect, it, vi } from "vitest";

import ConflictError from "@/app/lib/errors/ConflictError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

const { findUnique, count, del } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  count: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhClass: { findUnique, delete: del },
    dhSubclass: { count },
  },
}));

import { deleteDhClassById } from "./deleteDhClassById";

describe("deleteDhClassById (SPEC-021 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue({ id: 5, name: "Lantern Warden" });
    del.mockResolvedValue({});
  });

  it("deletes a class no subclass belongs to", async () => {
    count.mockResolvedValue(0);

    await deleteDhClassById(5);

    expect(del).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it("refuses while subclasses belong to it, with a catalogue key and the count", async () => {
    count.mockResolvedValue(2);

    const refusal = deleteDhClassById(5);

    await expect(refusal).rejects.toBeInstanceOf(ConflictError);
    await expect(refusal).rejects.toMatchObject({
      refusal: { key: "classHasSubclasses", values: { count: 2 } },
    });
    expect(count).toHaveBeenCalledWith({ where: { classId: 5 } });
    expect(del).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a missing class", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deleteDhClassById(5)).rejects.toBeInstanceOf(NotFoundError);
    expect(del).not.toHaveBeenCalled();
  });
});
