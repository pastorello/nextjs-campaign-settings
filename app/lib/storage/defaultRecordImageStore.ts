import path from "path";

import env from "@/app/lib/config/env";
import FilesystemImageStore from "./FilesystemImageStore";
import ImageStore from "./ImageStore";

// Record images live in their own folder under `UPLOAD_DIR` (ADR-0017), so
// the map route — which serves bare filenames from `UPLOAD_DIR` itself —
// can never reach one, and the two kinds can be backed up or moved apart.
const defaultRecordImageStore: ImageStore = new FilesystemImageStore(
  path.join(env.UPLOAD_DIR, "records")
);

export default defaultRecordImageStore;
