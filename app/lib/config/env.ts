import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid connection string"),
  // Where uploaded map images live on disk (ADR-0008). Dev: a gitignored
  // `./storage/maps`; production: the same path backed by a named volume.
  UPLOAD_DIR: z.string().min(1, "UPLOAD_DIR must not be empty"),
});

/**
 * The environment, validated once at import time (TD-02b).
 *
 * Replaces every `process.env.DATABASE_URL!` at its call sites. The `!` only
 * told the compiler to stop worrying; a missing or malformed value still
 * reached `PrismaPg`'s constructor unexamined and failed there, several files
 * away from the actual cause. Parsing here means a missing variable throws
 * immediately, naming it, at the first import instead of at first use.
 */
const env = envSchema.parse(process.env);

export default env;
