import bcrypt from "bcrypt";
import z from "zod";

import type { users } from "@/generated/prisma/client";
import prisma from "@/app/lib/connections/prisma";
import logServerIssue from "@/app/lib/notifications/logServerIssue";

async function getUser(email: string): Promise<users | undefined> {
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    return user ?? undefined;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

/**
 * The credentials provider's `authorize`: the account's row when the email
 * and password match an active account, null otherwise.
 */
export default async function authorizeCredentials(
  credentials: Partial<Record<string, unknown>>
): Promise<users | null> {
  const parsedCredentials = z
    .object({ email: z.string().email(), password: z.string().min(6) })
    .safeParse(credentials);

  if (parsedCredentials.success) {
    const { email, password } = parsedCredentials.data;
    const user = await getUser(email);
    if (!user) return null;
    const passwordsMatch = await bcrypt.compare(password, user.password);

    // SPEC-022: a disabled account, or a DM sign-up not yet activated, reads
    // to the form exactly like a wrong password.
    if (passwordsMatch && user.active) return user;
  }

  // Runs inside the credentials provider, on the server. The user learns
  // the attempt failed from what authenticate() returns to the form; this
  // is the trace for whoever is running it.
  logServerIssue("Sign-in rejected: invalid credentials");
  return null;
}
