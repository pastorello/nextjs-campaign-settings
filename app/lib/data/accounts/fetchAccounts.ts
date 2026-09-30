import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import type Account from "@/app/lib/definitions/interfaces/users/Account";
import { isUserRole } from "@/app/lib/definitions/UserRole";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Every account, for the DM's accounts page (SPEC-022 T3), by name. Guarded
 * itself as well as by the page: it returns email addresses.
 */
export default async function fetchAccounts(): Promise<Account[]> {
  await requireDm();

  let rows;
  try {
    rows = await prisma.users.findMany({
      select: { id: true, name: true, email: true, role: true, active: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });
  } catch (error) {
    throw toDatabaseError("listing the accounts", error);
  }

  // The CHECK constraint makes anything else impossible; the narrowing
  // keeps the type honest without an assertion.
  return rows.flatMap((row) =>
    isUserRole(row.role) ? [{ ...row, role: row.role }] : []
  );
}
