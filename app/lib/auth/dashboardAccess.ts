import prisma from "@/app/lib/connections/prisma";

/** What an account may do with the dashboard (SPEC-022 T1). */
export type DashboardAccess = "dm" | "player" | "none";

/**
 * The proxy's fresh answer for a signed-in request under `/dashboard`
 * (ADR-0020). It is read from the account's row, not the token, because the
 * token's role is fixed at sign-in, and a page's data renders in parallel
 * with its layout. A layout's refusal would still send that data. So the
 * refusal has to happen here, before anything renders.
 *
 * `"none"` means the account is gone or disabled: the request is treated as
 * signed out. If the database cannot be reached, the token's role is used:
 * no page can render its data without the database anyway.
 */
export default async function dashboardAccess(token: {
  sub?: string | undefined;
  role?: string | undefined;
}): Promise<DashboardAccess> {
  if (!token.sub) return "none";
  try {
    const account = await prisma.users.findUnique({
      where: { id: token.sub },
      select: { role: true, active: true },
    });
    if (!account?.active) return "none";
    return account.role === "dm" ? "dm" : "player";
  } catch (error) {
    console.error("Dashboard access check failed; using the token:", error);
    return token.role === "player" ? "player" : "dm";
  }
}
