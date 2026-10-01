"use server";

import z from "zod";

import prisma from "@/app/lib/connections/prisma";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  accountEmailSchema,
  accountNameSchema,
  passwordSchema,
} from "@/app/lib/data/validation/accountSchemas";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import isUniqueViolation from "@/app/lib/errors/isUniqueViolation";

import hashPassword from "./hashPassword";

const requestDmAccountSchema = z.object({
  name: accountNameSchema,
  email: accountEmailSchema,
  password: passwordSchema,
});

/**
 * A would-be DM asks for an account from the logged-out screen (SPEC-022 T4).
 *
 * **The one mutation that does not check a session**, by nature: whoever
 * signs up has none. `CLAUDE.md` rule 1 records the exception. It is kept
 * safe by what it can do:
 * - the account is created **inactive**, so it cannot sign in, and grants
 *   nothing, until a DM activates it from the accounts page;
 * - its role is always `dm`, never one the client names;
 * - its input is validated like every other mutation's.
 *
 * An email already in use answers exactly like a new one, so the form
 * cannot be used to learn which addresses have accounts. Only a malformed
 * field is reported back.
 */
export default async function requestDmAccount(
  input: z.input<typeof requestDmAccountSchema>
): Promise<MutationResult> {
  const parsed = requestDmAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { name, email, password } = parsed.data;

  try {
    await prisma.users.create({
      data: {
        name,
        email,
        role: "dm",
        active: false,
        password: await hashPassword(password),
      },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw toDatabaseError("requesting a DM account", error);
    }
  }

  return { ok: true };
}
