import { describe, expect, it } from "vitest";

import {
  ALLOWED_MAP_IMAGE_CONTENT_TYPES,
  contentTypeForExtension,
  extensionForContentType,
} from "./mapImageUploadRules";

describe("mapImageUploadRules", () => {
  it("maps every allowed content type to an extension and back", () => {
    for (const contentType of ALLOWED_MAP_IMAGE_CONTENT_TYPES) {
      const extension = extensionForContentType(contentType);
      expect(extension).toBeDefined();
      expect(contentTypeForExtension(extension as string)).toBe(contentType);
    }
  });

  it("returns undefined for an unrecognised content type", () => {
    expect(extensionForContentType("application/pdf")).toBeUndefined();
  });

  it("returns undefined for an unrecognised extension", () => {
    expect(contentTypeForExtension("gif")).toBeUndefined();
  });

  it("matches extensions case-insensitively", () => {
    expect(contentTypeForExtension("PNG")).toBe("image/png");
  });
});
