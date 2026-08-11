import { Prisma } from "@/generated/prisma/client";

/**
 * Whether a write failed because it referenced a row that isn't there —
 * Prisma's `P2003`. Distinct from every other database failure `toDatabaseError`
 * wraps: this one is a field-level validation problem the caller can fix by
 * choosing something else, not a query or connection fault (SPEC-006 §7).
 */
export default function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
