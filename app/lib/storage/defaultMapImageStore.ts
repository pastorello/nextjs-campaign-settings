import FilesystemMapImageStore from "./FilesystemMapImageStore";
import MapImageStore from "./MapImageStore";

// Named `default*`, not `mapImageStore`, so its filename does not collide
// with `MapImageStore.ts` on a case-insensitive filesystem (macOS/Windows).
const defaultMapImageStore: MapImageStore = new FilesystemMapImageStore();

export default defaultMapImageStore;
