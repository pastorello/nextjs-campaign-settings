import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { MAX_IMAGE_BYTES } from "@/app/lib/storage/imageUploadRules";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { storeRecordImage } = vi.hoisted(() => ({
  storeRecordImage:
    vi.fn<(input: Buffer, store: unknown) => Promise<unknown>>(),
}));
vi.mock("@/app/lib/storage/storeRecordImage", () => ({
  default: storeRecordImage,
}));
const { createRecordImage } = vi.hoisted(() => ({
  createRecordImage:
    vi.fn<(image: unknown, store: unknown) => Promise<number | null>>(),
}));
vi.mock("@/app/lib/data/recordImages/createRecordImage", () => ({
  default: createRecordImage,
}));
vi.mock("@/app/lib/storage/defaultRecordImageStore", () => ({
  default: { put: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

import { POST } from "./route";

// `formData()` is stubbed for the reason given in
// `app/api/maps/upload/route.test.ts`: jsdom's `FormData` and `File` fail
// each other's brand checks, so a real multipart body cannot be parsed here.
function requestWithFile(file: File | null) {
  const request = new NextRequest("http://localhost/api/record-images", {
    method: "POST",
  });
  const formData = vi.spyOn(request, "formData").mockResolvedValue({
    get: (key: string) => (key === "file" ? file : null),
  } as unknown as FormData);
  return { request, formData };
}

const signedIn = () =>
  vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);

describe("POST /api/record-images", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses an unauthenticated request without reading or storing anything", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const { request, formData } = requestWithFile(
      new File(["x"], "portrait.png", { type: "image/png" })
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(formData).not.toHaveBeenCalled();
    expect(storeRecordImage).not.toHaveBeenCalled();
  });

  it("answers imageRequired when no file is sent", async () => {
    signedIn();

    const response = await POST(requestWithFile(null).request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "imageRequired" });
    expect(storeRecordImage).not.toHaveBeenCalled();
  });

  it("answers imageTooLarge for a file over 10 MB without running the pipeline", async () => {
    signedIn();
    const big = new File(["x"], "huge.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: MAX_IMAGE_BYTES + 1 });

    const response = await POST(requestWithFile(big).request);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ error: "imageTooLarge" });
    expect(storeRecordImage).not.toHaveBeenCalled();
  });

  it.each([
    ["imageUnsupportedType", 415],
    ["imageUndecodable", 422],
    ["imageStoreFailed", 500],
  ])(
    "passes the pipeline's %s refusal through as %i",
    async (error, status) => {
      signedIn();
      storeRecordImage.mockResolvedValue({ ok: false, error });

      const response = await POST(
        requestWithFile(new File(["x"], "a.png", { type: "image/png" })).request
      );

      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual({ error });
    }
  );

  it("records the stored image as a row and returns its id, keys and size (SPEC-020 T3)", async () => {
    signedIn();
    createRecordImage.mockResolvedValue(7);
    const image = {
      displayKey: "d.webp",
      thumbKey: "t.webp",
      mimeType: "image/webp",
      width: 1600,
      height: 900,
    };
    storeRecordImage.mockResolvedValue({ ok: true, image });

    const response = await POST(
      requestWithFile(new File(["bytes"], "a.jpg", { type: "image/jpeg" }))
        .request
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: 7, ...image });
    expect(createRecordImage).toHaveBeenCalledWith(image, expect.anything());
    const [buffer] = storeRecordImage.mock.calls[0] ?? [];
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer?.toString()).toBe("bytes");
  });

  it("answers imageStoreFailed when the row cannot be saved", async () => {
    signedIn();
    storeRecordImage.mockResolvedValue({
      ok: true,
      image: {
        displayKey: "d.webp",
        thumbKey: "t.webp",
        mimeType: "image/webp",
        width: 10,
        height: 10,
      },
    });
    createRecordImage.mockResolvedValue(null);

    const response = await POST(
      requestWithFile(new File(["x"], "a.png", { type: "image/png" })).request
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "imageStoreFailed",
    });
  });
});
