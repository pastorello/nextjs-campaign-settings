import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { scope, mapVisible, recordVisible, mapGet, recordGet, findUnique } =
  vi.hoisted(() => ({
    scope: vi.fn(),
    mapVisible: vi.fn(),
    recordVisible: vi.fn(),
    mapGet: vi.fn(),
    recordGet: vi.fn(),
    findUnique: vi.fn(),
  }));
vi.mock("@/app/lib/auth/apiVisibilityScope", () => ({ default: scope }));
vi.mock("@/app/lib/data/visibility/isMapImageVisible", () => ({
  default: mapVisible,
}));
vi.mock("@/app/lib/data/visibility/isRecordImageVisible", () => ({
  default: recordVisible,
}));
vi.mock("@/app/lib/storage/defaultMapImageStore", () => ({
  default: { get: mapGet },
}));
vi.mock("@/app/lib/storage/defaultRecordImageStore", () => ({
  default: { get: recordGet },
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { recordImage: { findUnique } },
}));

import { GET as getMap } from "./[id]/image/route";
import { GET as getRecordImage } from "../record-images/by-id/[id]/route";

const player = {
  kind: "campaign",
  campaignId: 4,
  zones: new Set(),
  pois: new Set(),
};
const image = { data: Buffer.from("x"), contentType: "image/png" };

describe("image routes for a player (SPEC-022 T7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scope.mockResolvedValue(player);
    mapGet.mockResolvedValue(image);
    recordGet.mockResolvedValue(image);
    findUnique.mockResolvedValue({ displayKey: "d", thumbKey: "t" });
  });

  it("serves a map of a visible place, and 404s any other", async () => {
    mapVisible.mockResolvedValue(true);
    const ok = await getMap(new Request("http://x"), {
      params: Promise.resolve({ id: "k" }),
    });
    expect(ok.status).toBe(200);

    mapVisible.mockResolvedValue(false);
    const hidden = await getMap(new Request("http://x"), {
      params: Promise.resolve({ id: "k" }),
    });
    expect(hidden.status).toBe(404);
    expect(mapGet).toHaveBeenCalledTimes(1);
  });

  it("404s a record image whose record the player cannot see", async () => {
    recordVisible.mockResolvedValue(false);

    const response = await getRecordImage(
      new NextRequest("http://x/api/record-images/by-id/9"),
      { params: Promise.resolve({ id: "9" }) }
    );

    expect(response.status).toBe(404);
    expect(recordGet).not.toHaveBeenCalled();
  });
});
