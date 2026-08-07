import os from "node:os";
import path from "node:path";
import { z } from "zod";

// Not anchored under process.cwd(): several checkouts of this repo (e.g. an
// agent worktree alongside the maintainer's own clone) can share one
// DATABASE_URL while each having a different cwd. A cwd-relative default
// would silently split each checkout's map images into its own directory —
// exactly what happened once (TD-66). The home directory is the one location
// every process on the machine agrees on regardless of which checkout it runs
// from.
const DEFAULT_UPLOAD_DIR = path.join(
  os.homedir(),
  ".campaign-settings",
  "storage",
  "maps"
);

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid connection string"),
  // Where uploaded map images live on disk (ADR-0008). Must be an absolute
  // path — a relative one resolves against process.cwd(), which is exactly
  // how TD-66 happened: a migration script run from an agent worktree wrote
  // images to that worktree's own `./storage/maps`, invisible to every other
  // checkout sharing the same DATABASE_URL. Defaults to a fixed,
  // checkout-independent location when unset.
  UPLOAD_DIR: z
    .string()
    .min(1, "UPLOAD_DIR must not be empty")
    .refine((value) => path.isAbsolute(value), {
      message:
        "UPLOAD_DIR must be an absolute path (TD-66) — a relative one " +
        "resolves against process.cwd(), which differs between checkouts " +
        "of this repo even when they share one DATABASE_URL.",
    }),
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
const env = envSchema.parse({
  ...process.env,
  UPLOAD_DIR:
    process.env.UPLOAD_DIR === undefined || process.env.UPLOAD_DIR === ""
      ? DEFAULT_UPLOAD_DIR
      : process.env.UPLOAD_DIR,
});

export default env;
