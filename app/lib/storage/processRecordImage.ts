import sharp from "sharp";

import ProcessedRecordImage from "@/app/lib/definitions/interfaces/images/ProcessedRecordImage";
import FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";
import { MAX_IMAGE_BYTES } from "./imageUploadRules";

/** Longest side of the display version (SPEC-020 §5). */
export const DISPLAY_MAX_SIDE = 1600;
/** Side of the square, centre-cropped thumbnail (SPEC-020 §5). */
export const THUMBNAIL_SIDE = 256;
/**
 * Both versions are re-encoded as WebP whatever came in (ADR-0017): one
 * format keeps PNG emblems' transparency, which JPEG would lose, at a
 * fraction of PNG's size for a photographic portrait.
 */
export const RECORD_IMAGE_MIME_TYPE = "image/webp";
const WEBP_QUALITY = 82;

// Formats as libvips reports them after sniffing the bytes — never the
// file's extension or the client's claimed content type.
const ACCEPTED_FORMATS = new Set(["png", "jpeg", "webp"]);

// A 10 MB PNG of a flat colour can declare hundreds of millions of pixels
// and exhaust memory on decode (a decompression bomb). 64 MP — an 8000 px
// square — is far beyond any portrait or emblem, and is checked from the
// header before anything is decoded.
export const MAX_INPUT_PIXELS = 64_000_000;

type ProcessRecordImageResult =
  | { ok: true; image: ProcessedRecordImage }
  | { ok: false; error: FieldErrorKey };

/**
 * The record image pipeline (SPEC-020 §5, ADR-0017): checks the upload is a
 * PNG, JPEG or WebP of at most 10 MB by decoding it, applies its EXIF
 * orientation, and returns a display version and a thumbnail with every
 * metadata block (EXIF, including GPS, XMP, ICC) stripped — sharp writes
 * none unless asked to. Refusals are field error keys (ADR-0007), never
 * prose. Touches no storage and no database.
 */
export default async function processRecordImage(
  input: Buffer
): Promise<ProcessRecordImageResult> {
  if (input.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, error: "imageTooLarge" };
  }

  let format: string | undefined;
  let pixels: number;
  try {
    // Header only; the pixel limit is applied below, as its own refusal.
    const metadata = await sharp(input, { limitInputPixels: false }).metadata();
    format = metadata.format;
    pixels = metadata.width * metadata.height;
  } catch {
    return { ok: false, error: "imageUndecodable" };
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) {
    return { ok: false, error: "imageUnsupportedType" };
  }
  if (pixels > MAX_INPUT_PIXELS) {
    return { ok: false, error: "imageTooLarge" };
  }

  try {
    const source = sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: "error",
    }).autoOrient();

    const display = await source
      .clone()
      .resize(DISPLAY_MAX_SIDE, DISPLAY_MAX_SIDE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });

    const thumbnail = await source
      .clone()
      .resize(THUMBNAIL_SIDE, THUMBNAIL_SIDE, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    return {
      ok: true,
      image: {
        display: display.data,
        thumbnail,
        mimeType: RECORD_IMAGE_MIME_TYPE,
        width: display.info.width,
        height: display.info.height,
      },
    };
  } catch {
    // The header parsed but the pixel data did not: a truncated or corrupt
    // file that only claims to be an image.
    return { ok: false, error: "imageUndecodable" };
  }
}
