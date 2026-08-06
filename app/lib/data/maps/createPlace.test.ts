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

  it("creates a deity pin with its link", async () => {
    create.mockResolvedValue({ id: 7 });

    const result = await createPlace({
      ...commonFields,
      kind: "deity",
      linkedType: "deity",
      linkedId: 3,
    });

    expect(result).toEqual({ ok: true, id: 7 });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Somewhere",
        lat: 10,
        lng: 20,
        kind: "deity",
        parentId: 1,
        linkedType: "deity",
        linkedId: 3,
      },
    });
  });

  it("creates an npc pin with its link", async () => {
    create.mockResolvedValue({ id: 8 });

    const result = await createPlace({
      ...commonFields,
      kind: "npc",
      linkedType: "npc",
      linkedId: 5,
    });

    expect(result).toEqual({ ok: true, id: 8 });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Somewhere",
        lat: 10,
        lng: 20,
        kind: "npc",
        parentId: 1,
        linkedType: "npc",
        linkedId: 5,
      },
    });
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

  it("rejects a deity with a map image, without writing", async () => {
    const result = await createPlace({
      ...commonFields,
      kind: "deity",
      linkedType: "deity",
      linkedId: 3,
      mapImage: "kang.png",
    } as never);

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
