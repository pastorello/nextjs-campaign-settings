import env from "@/app/lib/config/env";
import FilesystemImageStore from "./FilesystemImageStore";
import ImageStore from "./ImageStore";

// Named `default*`, not `mapImageStore`, so no two filenames in this folder
// differ only by case — they would collide on a case-insensitive filesystem
// (macOS/Windows). Map images live directly in `UPLOAD_DIR` (ADR-0008).
const defaultMapImageStore: ImageStore = new FilesystemImageStore(
  env.UPLOAD_DIR
);

export default defaultMapImageStore;
