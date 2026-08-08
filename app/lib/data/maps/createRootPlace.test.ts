import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { findFirst, create } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findFirst, create } },
}));

import createRootPlace from "./createRootPlace";

describe("createRootPlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("creates the root on an empty installation", async () => {
    findFirst.mockResolvedValue(null);
    create.mockResolvedValue({ id: 1 });

    const result = await createRootPlace({
      title: "Aerivel",
      mapImage: "uploaded-id.png",
    });

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: { title: "Aerivel", mapImage: "uploaded-id.png", kind: "region" },
    });
  });

  it("refuses a second root without writing", async () => {
    findFirst.mockResolvedValue({ id: 1 });

    const result = await createRootPlace({
      title: "A second world",
      mapImage: "uploaded-id.png",
    });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a payload with no title, without checking for an existing root", async () => {
    const result = await createRootPlace({
      title: "",
      mapImage: "uploaded-id.png",
    });

    expect(result.ok).toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a payload with no map, without checking for an existing root", async () => {
    const result = await createRootPlace({ title: "Aerivel", mapImage: "" });

    expect(result.ok).toBe(false);
    expect(findFirst).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
