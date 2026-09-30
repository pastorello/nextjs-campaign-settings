"use server";

import z from "zod";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  accountIdSchema,
  passwordSchema,
} from "@/app/lib/data/validation/accountSchemas";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import hashPassword from "./hashPassword";

const setAccountPasswordSchema = z.object({
  id: accountIdSchema,
  password: passwordSchema,
});

/**
 * Sets another account's password: the hand-performed reset the DM chose
 * over mail (SPEC-022 §9). The DM tells the player the new one.
 */
export default async function setAccountPassword(
  input: z.input<typeof setAccountPasswordSchema>
): Promise<MutationResult> {
  await requireDm();

  const parsed = setAccountPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { id, password } = parsed.data;

  try {
    const { count } = await prisma.users.updateMany({
      where: { id },
      data: { password: await hashPassword(password) },
    });
    if (count === 0) {
      return { ok: false, errors: { id: [fieldError("accountNotFound")] } };
    }
  } catch (error) {
    throw toDatabaseError("setting an account's password", error);
  }

  return { ok: true };
}
