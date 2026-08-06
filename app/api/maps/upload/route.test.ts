import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { put } = vi.hoisted(() => ({ put: vi.fn() }));
vi.mock("@/app/lib/storage/defaultMapImageStore", () => ({
  default: { put },
}));

import { POST } from "./route";

// Not a real multipart body: jsdom's own `FormData`/`File` fail their internal
// webidl brand checks on each other in this test environment (a jsdom quirk,
// not something the route triggers). Stubbing `formData()` gives the route
// exactly what `request.formData()` would resolve to in production — a
// `FormData` whose `get("file")` returns a `File` — without going through
// jsdom's multipart parser at all.
function requestWithFormData(entries: Map<string, FormDataEntryValue>) {
  const request = new NextRequest("http://localhost/api/maps/upload", {
    method: "POST",
  });
  vi.spyOn(request, "formData").mockResolvedValue({
    get: (key: string) => entries.get(key) ?? null,
  } as unknown as FormData);
  return request;
}

function fileEntry(name: string, type: string, content: BlobPart): File {
  return new File([content], name, { type });
}

describe("POST /api/maps/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an unauthenticated request without touching the store", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const request = requestWithFormData(
      new Map([["file", fileEntry("map.png", "image/png", "x")]])
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a request with no file", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    const request = requestWithFormData(new Map());

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a disallowed content type", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    const request = requestWithFormData(
      new Map([["file", fileEntry("map.pdf", "application/pdf", "x")]])
    );

    const response = await POST(request);

    expect(response.status).toBe(415);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a file over the size limit", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    const request = requestWithFormData(
      new Map([
        [
          "file",
          fileEntry(
            "map.png",
            "image/png",
            new Uint8Array(10 * 1024 * 1024 + 1)
          ),
        ],
      ])
    );

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(put).not.toHaveBeenCalled();
  });

  it("stores a valid upload and returns its id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    put.mockResolvedValue("generated-id.png");
    const request = requestWithFormData(
      new Map([["file", fileEntry("map.png", "image/png", "map bytes")]])
    );

    const response = await POST(request);
    const body = (await response.json()) as { id: string };

    expect(response.status).toBe(201);
    expect(body.id).toBe("generated-id.png");
    expect(put).toHaveBeenCalledWith(expect.any(Buffer), "image/png");
  });
});
