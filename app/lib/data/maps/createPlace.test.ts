import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { poi: { create } },
}));

import createPlace from "./createPlace";

const commonFields = { title: "Somewhere", lat: 10, lng: 20, parentId: 1 };

describe("createPlace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("creates a region with its map image", async () => {
    create.mockResolvedValue({ id: 42 });

    const result = await createPlace({
      ...commonFields,
      kind: "region",
      mapImage: "kang.png",
    });

    expect(result).toEqual({ ok: true, id: 42 });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Somewhere",
        lat: 10,
        lng: 20,
        kind: "region",
        parentId: 1,
        mapImage: "kang.png",
      },
    });
  });

  it("creates a city with its map image (T2)", async () => {
    create.mockResolvedValue({ id: 43 });

    const result = await createPlace({
      ...commonFields,
      kind: "city",
      mapImage: "skreebars.png",
    });

    expect(result).toEqual({ ok: true, id: 43 });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Somewhere",
        lat: 10,
        lng: 20,
        kind: "city",
        parentId: 1,
        mapImage: "skreebars.png",
      },
    });
  });

  it("rejects a kind: deity payload, without writing — removed by SPEC-008 T5", async () => {
    const result = await createPlace({
      ...commonFields,
      kind: "deity",
      linkedType: "deity",
      linkedId: 3,
    } as never);

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a place with no parent, without writing", async () => {
    const result = await createPlace({
      title: "Somewhere",
      lat: 10,
      lng: 20,
      kind: "region",
      mapImage: "kang.png",
    });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a region with no map image, without writing", async () => {
    const result = await createPlace({
      ...commonFields,
      kind: "region",
    } as never);

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
