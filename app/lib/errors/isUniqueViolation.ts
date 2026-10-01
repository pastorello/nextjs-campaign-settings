import { Prisma } from "@/generated/prisma/client";

/**
 * Whether a write failed on a unique constraint — Prisma's `P2002`, such as
 * a second account with the same email (SPEC-022 T3). Like
 * `isForeignKeyViolation`, a field-level problem the caller can fix, not a
 * query or connection fault.
 */
export default function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
