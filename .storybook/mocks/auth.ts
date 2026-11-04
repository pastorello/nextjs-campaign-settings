import { fn } from "storybook/test";

/**
 * Storybook's `@/auth` (ADR-0021). The real module builds NextAuth over
 * Prisma and bcrypt, none of which load in a browser. Components only reach it
 * through an inline Server Action (`SignOutButton`'s sign-out form), so spies
 * are enough: Storybook logs each call in the Actions panel.
 */
export const auth = fn(() => Promise.resolve(null)).mockName("auth::auth");
export const signIn = fn(() => Promise.resolve(undefined)).mockName(
  "auth::signIn"
);
export const signOut = fn(() => Promise.resolve(undefined)).mockName(
  "auth::signOut"
);
