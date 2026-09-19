import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/app/lib/storage/defaultRecordImageStore", () => ({
  default: { get },
}));

import { GET } from "./route";

function fetchKey(key: string) {
  return GET(new Request(`http://localhost/api/record-images/${key}`), {
    params: Promise.resolve({ key }),
  });
}

describe("GET /api/record-images/[key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses an unauthenticated fetch without touching the store", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const response = await fetchKey("some-key.webp");

    expect(response.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });

  it("returns 404 when no image is stored under the key", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    get.mockResolvedValue(null);

    const response = await fetchKey("missing.webp");

    expect(response.status).toBe(404);
  });

  it("serves the bytes with their content type, cacheable only by the browser", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    const data = Buffer.from("webp-bytes");
    get.mockResolvedValue({ data, contentType: "image/webp" });

    const response = await fetchKey("found.webp");
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(get).toHaveBeenCalledWith("found.webp");
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(response.headers.get("Cache-Control")).toMatch(/^private\b/);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(body.equals(data)).toBe(true);
  });
});
