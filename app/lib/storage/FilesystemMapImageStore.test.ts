import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import FilesystemMapImageStore from "./FilesystemMapImageStore";

describe("FilesystemMapImageStore", () => {
  let baseDir: string;
  let store: FilesystemMapImageStore;

  beforeEach(async () => {
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), "map-image-store-"));
    store = new FilesystemMapImageStore(baseDir);
  });

  afterEach(async () => {
    await fs.rm(baseDir, { recursive: true, force: true });
  });

  it("round-trips an image through put and get", async () => {
    const data = Buffer.from("fake-png-bytes");

    const id = await store.put(data, "image/png");
    const image = await store.get(id);

    expect(image?.data.equals(data)).toBe(true);
    expect(image?.contentType).toBe("image/png");
  });

  it("returns null for an id that was never stored", async () => {
    await expect(store.get("does-not-exist.png")).resolves.toBeNull();
  });

  it("returns null for an id with an unrecognised extension", async () => {
    await expect(store.get("something.gif")).resolves.toBeNull();
  });

  it("refuses to store an unsupported content type", async () => {
    await expect(
      store.put(Buffer.from("x"), "application/pdf")
    ).rejects.toThrow(/Unsupported map image content type/);
  });

  it("deletes a stored image so it is no longer retrievable", async () => {
    const id = await store.put(Buffer.from("bytes"), "image/jpeg");

    await store.delete(id);

    await expect(store.get(id)).resolves.toBeNull();
  });

  it("treats deleting a missing id as a no-op", async () => {
    await expect(store.delete("never-existed.png")).resolves.toBeUndefined();
  });

  it("refuses to read outside baseDir via a path-traversal id", async () => {
    await expect(store.get("../escape.png")).resolves.toBeNull();
  });
});
