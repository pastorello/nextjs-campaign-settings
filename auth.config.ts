import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Gates every proxy-matched path (the dashboard) on "is there a session".
    // The proxy matcher excludes /api, so route handlers and Server Actions
    // guard themselves instead — see requireApiSession / requireSession (TD-01).
    // No per-route branching is needed here; login is the only requirement.
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
