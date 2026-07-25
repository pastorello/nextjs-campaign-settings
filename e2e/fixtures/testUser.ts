/**
 * The account created by `pnpm db:seed` (app/seed/initial-data/users.ts).
 *
 * These are fixture credentials for a local/CI database, not a secret: the
 * bcrypt hash of this password is committed in the seed file. Never point the
 * suite at an environment where they would grant real access.
 */
export const TEST_USER = {
  email: "user@nextmail.com",
  password: "123456",
} as const;

/** Where auth.setup.ts parks the signed-in session for the other specs. */
export const STORAGE_STATE = "e2e/.auth/user.json";
