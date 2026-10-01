import { NextResponse } from "next/server";

import { UnauthorizedError } from "@/app/lib/auth/requireDm";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import type VisibilityScope from "@/app/lib/data/visibility/VisibilityScope";

/**
 * `getVisibilityScope` for a route handler a player may reach (SPEC-022 T7):
 * the reader's scope, or the 401 to return without a session.
 *
 * ```ts
 * const scope = await apiVisibilityScope();
 * if (scope instanceof NextResponse) return scope;
 * ```
 */
export default async function apiVisibilityScope(): Promise<
  VisibilityScope | NextResponse
> {
  try {
    return await getVisibilityScope();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
