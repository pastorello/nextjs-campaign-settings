export interface MapImage {
  data: Buffer;
  contentType: string;
}

/**
 * Where uploaded map images live. Swapping the backend (S3, MinIO, a rented
 * host — see ADR-0008's alternatives) means implementing this interface, not
 * touching every call site.
 */
export default interface MapImageStore {
  /** Stores the bytes and returns the app-generated id they are stored under. */
  put(data: Buffer, contentType: string): Promise<string>;
  /** Returns the image, or `null` if `id` does not name a stored image. */
  get(id: string): Promise<MapImage | null>;
  /** Removes the image. A no-op if `id` does not name a stored image. */
  delete(id: string): Promise<void>;
}
