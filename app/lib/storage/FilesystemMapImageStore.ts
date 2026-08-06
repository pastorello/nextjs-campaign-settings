import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

import env from "@/app/lib/config/env";
import MapImageStore, { MapImage } from "./MapImageStore";
import {
  contentTypeForExtension,
  extensionForContentType,
} from "./mapImageUploadRules";

/**
 * `MapImageStore` backed by a directory on disk (ADR-0008). The extension
 * carries the content type, so no separate metadata file is needed per image.
 */
export default class FilesystemMapImageStore implements MapImageStore {
  private readonly baseDir: string;

  constructor(baseDir: string = env.UPLOAD_DIR) {
    this.baseDir = baseDir;
  }

  async put(data: Buffer, contentType: string): Promise<string> {
    const extension = extensionForContentType(contentType);
    if (!extension) {
      throw new Error(`Unsupported map image content type: ${contentType}`);
    }

    const id = `${randomUUID()}.${extension}`;
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(path.join(this.baseDir, id), data);
    return id;
  }

  async get(id: string): Promise<MapImage | null> {
    const filePath = this.resolve(id);
    if (!filePath) return null;

    const contentType = contentTypeForExtension(path.extname(id).slice(1));
    if (!contentType) return null;

    try {
      const data = await fs.readFile(filePath);
      return { data, contentType };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const filePath = this.resolve(id);
    if (!filePath) return;

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  // `id` reaches this class from a route param, so it must be constrained to a
  // bare filename before joining it onto `baseDir` — otherwise `../../etc` is
  // a path-traversal read. Returns null instead of throwing: an invalid id is
  // "not found" from the caller's point of view.
  private resolve(id: string): string | null {
    const filename = path.basename(id);
    return filename === id ? path.join(this.baseDir, filename) : null;
  }
}
