import { NextResponse } from "next/server";

import { auth } from "@/auth";

/**
 * Guard for route handlers. The proxy matcher excludes `/api`, so handlers get
 * no auth from it and must check themselves. Returns the response the caller
 * should return, 401 without a session and 403 for a player (SPEC-022), or
 * `null` for the DM:
 *
 * ```ts
 * const refused = await requireApiDm();
 * if (refused) return refused;
 * ```
 *
 * Every route handler is the DM's until SPEC-022 T7/T8 open the read routes
 * to players, one filtered path at a time.
 */
export default async function requireApiDm(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "dm") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
