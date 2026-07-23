import { NextResponse } from "next/server";
import { z } from "zod";

// Record ids are positive integers. `parseInt` was accepting anything: "abc"
// became NaN and went straight into a Prisma `where`, and "1.5" silently became
// 1. Anything that is not a whole positive number is a client error, not a
// lookup that happens to miss.
const idSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

/**
 * Validates a route's `:id` segment. Returns the parsed number, or the 400
 * response the handler should return:
 *
 * ```ts
 * const id = parseIdParam(theParams.id);
 * if (id instanceof NextResponse) return id;
 * ```
 */
export default function parseIdParam(raw: string): number | NextResponse {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid id", details: parsed.error.flatten().formErrors },
      { status: 400 }
    );
  }
  return parsed.data;
}
