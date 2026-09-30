import type { DefaultSession } from "next-auth";

import type UserRole from "@/app/lib/definitions/UserRole";

// SPEC-022 T1: the session names the account and its role, so a page can
// decide what to render without a query. The guards still trust only what
// `auth.ts`'s jwt callback has just re-read from the row.
declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }

  // What `authorize` returns: the `users` row, role included.
  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
  }
}
