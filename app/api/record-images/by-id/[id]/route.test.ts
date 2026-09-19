import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { findUnique, get } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  get: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { recordImage: { findUnique } },
}));
vi.mock("@/app/lib/storage/defaultRecordImageStore", () => ({
  default: { put: vi.fn(), get, delete: vi.fn() },
}));

import { GET } from "./route";

function call(id: string, query = "") {
  return GET(
    new NextRequest(`http://localhost/api/record-images/by-id/${id}${query}`),
    { params: Promise.resolve({ id }) }
  );
}

const row = { displayKey: "display.webp", thumbKey: "thumb.webp" };

describe("GET /api/record-images/by-id/[id] (SPEC-020 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("refuses an unauthenticated request without reading anything", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const response = await call("5");

    expect(response.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it.each([["abc"], ["0"], ["1.5"]])("answers 400 for id %s", async (id) => {
    expect((await call(id)).status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("answers 400 for an unknown size", async () => {
    expect((await call("5", "?size=original")).status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("answers 404 when no row has the id", async () => {
    findUnique.mockResolvedValue(null);

    expect((await call("5")).status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });

  it("answers 404 when the row's file is missing", async () => {
    findUnique.mockResolvedValue(row);
    get.mockResolvedValue(null);

    expect((await call("5")).status).toBe(404);
  });

  it("serves the thumbnail by default, privately cached", async () => {
    findUnique.mockResolvedValue(row);
    get.mockResolvedValue({
      data: Buffer.from("thumb-bytes"),
      contentType: "image/webp",
    });

    const response = await call("5");

    expect(get).toHaveBeenCalledWith("thumb.webp");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=31536000, immutable"
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe(
      "thumb-bytes"
    );
  });

  it("serves the display version on request", async () => {
    findUnique.mockResolvedValue(row);
    get.mockResolvedValue({
      data: Buffer.from("display-bytes"),
      contentType: "image/webp",
    });

    await call("5", "?size=display");

    expect(get).toHaveBeenCalledWith("display.webp");
  });

  it("answers 500 when the lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    findUnique.mockRejectedValue(new Error("db down"));

    expect((await call("5")).status).toBe(500);
  });
});
