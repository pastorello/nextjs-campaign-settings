import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Gates every path the proxy matcher covers on nothing but "is there a
    // session". Route-based branching is TD-01's job, together with the auth
    // guards the API handlers still lack — this callback does not protect them.
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
