import bcrypt from "bcrypt";

/** The cost the seed's hash was made with. */
const BCRYPT_ROUNDS = 10;

/** Hashes a password for `users.password` (SPEC-022 T2, T3). */
export default function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
