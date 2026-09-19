import sharp from "sharp";

/**
 * A small real PNG for the image field (SPEC-020). Generated rather than
 * committed: the server decodes every upload, so a few magic bytes would be
 * refused, and a real file in the repo is one more thing to keep.
 */
export const portraitPng = async () => ({
  name: "portrait.png",
  mimeType: "image/png",
  buffer: await sharp({
    create: {
      width: 64,
      height: 48,
      channels: 3,
      background: { r: 180, g: 40, b: 40 },
    },
  })
    .png()
    .toBuffer(),
});
