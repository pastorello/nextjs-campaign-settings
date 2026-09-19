import fs from "fs/promises";
import os from "os";
import path from "path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FilesystemImageStore from "./FilesystemImageStore";
import ImageStore from "./ImageStore";
import storeRecordImage from "./storeRecordImage";

function png(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 4, background: "#8040c0" },
  })
    .png()
    .toBuffer();
}

describe("storeRecordImage", () => {
  let baseDir: string;
  let store: FilesystemImageStore;

  beforeEach(async () => {
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), "record-image-store-"));
    store = new FilesystemImageStore(baseDir);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(baseDir, { recursive: true, force: true });
  });

  it("stores a display version and a thumbnail and returns their keys and size", async () => {
    const result = await storeRecordImage(await png(2000, 1000), store);
    if (!result.ok) throw new Error(`refused with ${result.error}`);

    const { displayKey, thumbKey, mimeType, width, height } = result.image;
    expect(displayKey).not.toBe(thumbKey);
    expect(mimeType).toBe("image/webp");
    expect([width, height]).toEqual([1600, 800]);

    const display = await store.get(displayKey);
    const thumbnail = await store.get(thumbKey);
    expect(display?.contentType).toBe("image/webp");
    expect((await sharp(thumbnail?.data).metadata()).width).toBe(256);
    expect(await fs.readdir(baseDir)).toHaveLength(2);
  });

  it("stores nothing when the pipeline refuses the upload", async () => {
    const result = await storeRecordImage(Buffer.from("not an image"), store);

    expect(result).toEqual({ ok: false, error: "imageUndecodable" });
    await expect(fs.readdir(baseDir)).resolves.toHaveLength(0);
  });

  it("reports a write failure as a field error", async () => {
    const failing: ImageStore = {
      put: vi.fn().mockRejectedValue(new Error("disk full")),
      get: vi.fn(),
      delete: vi.fn(),
    };

    await expect(storeRecordImage(await png(10, 10), failing)).resolves.toEqual(
      { ok: false, error: "imageStoreFailed" }
    );
  });

  it("deletes the display file again when the thumbnail cannot be written", async () => {
    const put = vi
      .fn()
      .mockImplementationOnce((data: Buffer, type: string) =>
        store.put(data, type)
      )
      .mockRejectedValueOnce(new Error("disk full"));
    const failingSecondWrite: ImageStore = {
      put,
      get: (id) => store.get(id),
      delete: (id) => store.delete(id),
    };

    const result = await storeRecordImage(
      await png(10, 10),
      failingSecondWrite
    );

    expect(result).toEqual({ ok: false, error: "imageStoreFailed" });
    await expect(fs.readdir(baseDir)).resolves.toHaveLength(0);
  });
});
