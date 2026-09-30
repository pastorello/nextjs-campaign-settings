import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

import prisma from "@/app/lib/connections/prisma";
import { isUserRole } from "@/app/lib/definitions/UserRole";

/**
 * `auth.ts`'s jwt callback (SPEC-022 T1). It runs at sign-in and on every
 * `auth()` call. At sign-in, `user` is the row `authorizeCredentials`
 * returned. On every later call the row is re-read, so a disabled, deleted
 * or demoted account takes effect at its next request, not when its token
 * expires. Returning null ends the session.
 */
export async function jwt({
  token,
  user,
}: {
  token: JWT;
  user?: User;
}): Promise<JWT | null> {
  if (user) {
    if (!isUserRole(user.role)) return null;
    token.role = user.role;
    return token;
  }
  if (!token.sub) return null;

  let account: { role: string; active: boolean } | null;
  try {
    account = await prisma.users.findUnique({
      where: { id: token.sub },
      select: { role: true, active: true },
    });
  } catch (error) {
    // An unreachable database must not sign everyone out, so the token is
    // kept as it was. Every mutation needs the database anyway, so a stale
    // role cannot write anything while it is down.
    console.error("Session refresh failed; keeping the token:", error);
    return token;
  }
  if (!account?.active || !isUserRole(account.role)) return null;
  token.role = account.role;
  return token;
}

/** Exposes the account's id and role on the session the app reads. */
export function session({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Session {
  if (token.sub) session.user.id = token.sub;
  if (token.role) session.user.role = token.role;
  return session;
}
