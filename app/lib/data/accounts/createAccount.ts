"use server";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  createAccountSchema,
  type CreateAccountInput,
} from "@/app/lib/data/validation/accountSchemas";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

import hashPassword from "./hashPassword";
import isUniqueViolation from "@/app/lib/errors/isUniqueViolation";

/**
 * The DM creates an account (SPEC-022 T3): a player for one of their
 * tables, or another DM. The DM chooses its first password and hands it
 * over; there is no mail (§3).
 */
export default async function createAccount(
  input: CreateAccountInput
): Promise<MutationResult> {
  await requireDm();

  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { name, email, password, role } = parsed.data;

  try {
    await prisma.users.create({
      data: { name, email, role, password: await hashPassword(password) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, errors: { email: [fieldError("emailTaken")] } };
    }
    throw toDatabaseError("creating an account", error);
  }

  revalidateDashboard("admin/accounts");
  return { ok: true };
}
