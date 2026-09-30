import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";

import authorizeCredentials from "@/app/lib/auth/authorizeCredentials";
import { jwt, session } from "@/app/lib/auth/sessionCallbacks";

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({ authorize: authorizeCredentials })],
  callbacks: { ...authConfig.callbacks, jwt, session },
});
