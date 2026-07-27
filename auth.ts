import NextAuth from "next-auth";
import z from "zod";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";

import type { User } from "@/app/lib/definitions";
import bcrypt from "bcrypt";
import prisma from "@/app/lib/connections/prisma";
import logServerIssue from "./app/lib/notifications/logServerIssue";

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    return user ?? undefined;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        // Runs inside the credentials provider, on the server. The user learns
        // the attempt failed from what authenticate() returns to the form; this
        // is the trace for whoever is running it.
        logServerIssue("Sign-in rejected: invalid credentials");
        return null;
      },
    }),
  ],
});
