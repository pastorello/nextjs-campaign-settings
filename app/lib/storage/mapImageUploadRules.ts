const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSION_BY_CONTENT_TYPE).map(([contentType, extension]) => [
    extension,
    contentType,
  ])
);

export const ALLOWED_MAP_IMAGE_CONTENT_TYPES = Object.keys(
  EXTENSION_BY_CONTENT_TYPE
);

// 10 MB. Inkarnate exports run a few MB each per ADR-0008 — comfortably above
// that, well below anything that would make an upload a DoS vector at this
// app's single-DM scale.
export const MAX_MAP_IMAGE_BYTES = 10 * 1024 * 1024;

export function extensionForContentType(
  contentType: string
): string | undefined {
  return EXTENSION_BY_CONTENT_TYPE[contentType];
}

export function contentTypeForExtension(extension: string): string | undefined {
  return CONTENT_TYPE_BY_EXTENSION[extension.toLowerCase()];
}
