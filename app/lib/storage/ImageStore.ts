export interface StoredImage {
  data: Buffer;
  contentType: string;
}

/**
 * Where uploaded images live — map images (ADR-0008) and record images
 * (ADR-0017), each in its own instance. Swapping the backend (S3, MinIO, a
 * rented host — see ADR-0008's alternatives) means implementing this
 * interface, not touching every call site.
 */
export default interface ImageStore {
  /** Stores the bytes and returns the app-generated id they are stored under. */
  put(data: Buffer, contentType: string): Promise<string>;
  /** Returns the image, or `null` if `id` does not name a stored image. */
  get(id: string): Promise<StoredImage | null>;
  /** Removes the image. A no-op if `id` does not name a stored image. */
  delete(id: string): Promise<void>;
}
