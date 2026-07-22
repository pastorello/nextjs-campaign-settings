import { NextResponse } from "next/server";

import { auth } from "@/auth";

/**
 * Guard for route handlers. The proxy matcher excludes `/api`, so handlers get
 * no auth from it and must check themselves. Returns the 401 response the
 * caller should return when there is no session, or `null` when authenticated:
 *
 * ```ts
 * const unauthorized = await requireApiSession();
 * if (unauthorized) return unauthorized;
 * ```
 */
export default async function requireApiSession(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
