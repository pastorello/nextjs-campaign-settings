import sharp from "sharp";
import { crc32, deflateSync } from "zlib";
import { describe, expect, it } from "vitest";

import { MAX_IMAGE_BYTES } from "./imageUploadRules";
import processRecordImage, {
  DISPLAY_MAX_SIDE,
  MAX_INPUT_PIXELS,
  RECORD_IMAGE_MIME_TYPE,
  THUMBNAIL_SIDE,
} from "./processRecordImage";

// Test images are generated here rather than committed as binary fixtures.
function solid(width: number, height: number) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 40, b: 200 },
    },
  });
}

function pngChunk(type: string, body: Buffer): Buffer {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, body])));
  return Buffer.concat([length, typeBytes, body, crc]);
}

// A tiny PNG whose header declares the given size but whose pixel data is a
// few bytes: the shape of a decompression bomb, without the memory cost.
function pngDeclaring(width: number, height: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.alloc(10))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function expectProcessed(input: Buffer) {
  const result = await processRecordImage(input);
  if (!result.ok) throw new Error(`refused with ${result.error}`);
  return result.image;
}

describe("processRecordImage", () => {
  it.each([
    ["PNG", () => solid(40, 30).png().toBuffer()],
    ["JPEG", () => solid(40, 30).jpeg().toBuffer()],
    ["WebP", () => solid(40, 30).webp().toBuffer()],
  ])("accepts a %s and re-encodes it as WebP", async (_format, make) => {
    const image = await expectProcessed(await make());

    expect(image.mimeType).toBe(RECORD_IMAGE_MIME_TYPE);
    expect((await sharp(image.display).metadata()).format).toBe("webp");
    expect((await sharp(image.thumbnail).metadata()).format).toBe("webp");
  });

  it("refuses a format outside PNG/JPEG/WebP, whatever the file claims", async () => {
    const gif = await solid(10, 10).gif().toBuffer();

    await expect(processRecordImage(gif)).resolves.toEqual({
      ok: false,
      error: "imageUnsupportedType",
    });
  });

  it("refuses bytes that are not an image at all", async () => {
    await expect(
      processRecordImage(Buffer.from("<?php echo 'not an image'; ?>"))
    ).resolves.toEqual({ ok: false, error: "imageUndecodable" });
  });

  it("refuses an image whose header parses but whose pixels do not", async () => {
    const jpeg = await solid(200, 200).jpeg().toBuffer();
    const truncated = jpeg.subarray(0, Math.floor(jpeg.length / 2));

    await expect(processRecordImage(truncated)).resolves.toEqual({
      ok: false,
      error: "imageUndecodable",
    });
  });

  it("refuses more than 10 MB before decoding anything", async () => {
    const oversized = Buffer.alloc(MAX_IMAGE_BYTES + 1);

    await expect(processRecordImage(oversized)).resolves.toEqual({
      ok: false,
      error: "imageTooLarge",
    });
  });

  it("refuses a header declaring more pixels than the limit (decompression bomb)", async () => {
    const side = Math.ceil(Math.sqrt(MAX_INPUT_PIXELS)) + 1;

    await expect(processRecordImage(pngDeclaring(side, side))).resolves.toEqual(
      { ok: false, error: "imageTooLarge" }
    );
  });

  it("scales a large image so its longest side is 1600 px, keeping its ratio", async () => {
    const image = await expectProcessed(
      await solid(3200, 800).png().toBuffer()
    );

    expect(image.width).toBe(DISPLAY_MAX_SIDE);
    expect(image.height).toBe(400);
    const display = await sharp(image.display).metadata();
    expect([display.width, display.height]).toEqual([DISPLAY_MAX_SIDE, 400]);
  });

  it("never enlarges a display version smaller than 1600 px", async () => {
    const image = await expectProcessed(await solid(300, 500).png().toBuffer());

    expect([image.width, image.height]).toEqual([300, 500]);
  });

  it("makes a 256 px square thumbnail even from a very tall image", async () => {
    const image = await expectProcessed(
      await solid(100, 2000).png().toBuffer()
    );

    const thumbnail = await sharp(image.thumbnail).metadata();
    expect([thumbnail.width, thumbnail.height]).toEqual([
      THUMBNAIL_SIDE,
      THUMBNAIL_SIDE,
    ]);
  });

  it("strips EXIF — including GPS — from both versions", async () => {
    const withExif = await solid(64, 64)
      .jpeg()
      .withExif({
        IFD0: { Copyright: "secret" },
        IFD3: { GPSLatitudeRef: "N", GPSLatitude: "45/1 26/1 0/1" },
      })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const image = await expectProcessed(withExif);

    for (const output of [image.display, image.thumbnail]) {
      const metadata = await sharp(output).metadata();
      expect(metadata.exif).toBeUndefined();
      expect(metadata.xmp).toBeUndefined();
      expect(metadata.orientation).toBeUndefined();
    }
  });

  it("applies the EXIF orientation before stripping it", async () => {
    // Orientation 6: stored landscape, meant to be shown rotated 90°.
    const sideways = await solid(200, 100)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const image = await expectProcessed(sideways);

    expect([image.width, image.height]).toEqual([100, 200]);
  });
});
