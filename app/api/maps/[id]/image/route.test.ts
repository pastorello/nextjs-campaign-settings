import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/app/lib/storage/defaultMapImageStore", () => ({
  default: { get },
}));

import { GET } from "./route";

function contextFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/maps/[id]/image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses an unauthenticated fetch without touching the store", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const response = await GET(
      new Request("http://localhost/api/maps/some-id.png/image"),
      contextFor("some-id.png")
    );

    expect(response.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });

  it("returns 404 when the image does not exist", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    get.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/maps/missing.png/image"),
      contextFor("missing.png")
    );

    expect(response.status).toBe(404);
  });

  it("streams the image bytes with the stored content type", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    const data = Buffer.from("png-bytes");
    get.mockResolvedValue({ data, contentType: "image/png" });

    const response = await GET(
      new Request("http://localhost/api/maps/found.png/image"),
      contextFor("found.png")
    );
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(body.equals(data)).toBe(true);
  });
});
