import type NextAuthConfig from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // auth.config.js
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isApiRoute = nextUrl.pathname.startsWith("/app/api/");

      // Ignora le route API
      if (isLoggedIn) {
        return true;
      }
      return false;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies typeof NextAuthConfig;
