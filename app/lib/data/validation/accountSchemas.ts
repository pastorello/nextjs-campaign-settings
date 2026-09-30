import z from "zod";

import { USER_ROLES } from "@/app/lib/definitions/UserRole";

/**
 * A password set through the app (SPEC-022 T2, T3). Sign-in still accepts the
 * six characters the seed's account was created with. bcrypt reads at most
 * 72 bytes, so a longer password would be silently truncated.
 */
export const passwordSchema = z.string().min(8).max(72);

export const accountNameSchema = z.string().trim().min(1).max(255);

/**
 * Stored lower-cased, and matched lower-cased at sign-in, so the same address
 * typed with capitals is one account.
 */
export const accountEmailSchema = z.string().trim().toLowerCase().email();

export const accountRoleSchema = z.enum(USER_ROLES);

export const accountIdSchema = z.uuid();

export const createAccountSchema = z.object({
  name: accountNameSchema,
  email: accountEmailSchema,
  password: passwordSchema,
  role: accountRoleSchema,
});
export type CreateAccountInput = z.input<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
  id: accountIdSchema,
  name: accountNameSchema,
  role: accountRoleSchema,
});
export type UpdateAccountInput = z.input<typeof updateAccountSchema>;

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
export type ChangeOwnPasswordInput = z.input<typeof changeOwnPasswordSchema>;
