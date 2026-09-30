"use server";

import bcrypt from "bcrypt";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  changeOwnPasswordSchema,
  type ChangeOwnPasswordInput,
} from "@/app/lib/data/validation/accountSchemas";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import hashPassword from "./hashPassword";

/**
 * The signed-in DM changes their own password (SPEC-022 T2). The current
 * password is required, so an unattended open session cannot be used to
 * lock its owner out.
 */
export default async function changeOwnPassword(
  input: ChangeOwnPasswordInput
): Promise<MutationResult> {
  const session = await requireDm();

  const parsed = changeOwnPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { currentPassword, newPassword } = parsed.data;

  try {
    const account = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });
    if (
      !account ||
      !(await bcrypt.compare(currentPassword, account.password))
    ) {
      return {
        ok: false,
        errors: { currentPassword: [fieldError("wrongPassword")] },
      };
    }
    await prisma.users.update({
      where: { id: session.user.id },
      data: { password: await hashPassword(newPassword) },
    });
  } catch (error) {
    throw toDatabaseError("changing the signed-in account's password", error);
  }

  return { ok: true };
}
