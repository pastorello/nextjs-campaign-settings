"use server";

import z from "zod";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import { accountNameSchema } from "@/app/lib/data/validation/accountSchemas";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

const updateOwnNameSchema = z.object({ name: accountNameSchema });

/**
 * The signed-in DM renames their own account (SPEC-022 T2). The account is
 * the session's, never an id the client sends.
 */
export default async function updateOwnName(
  input: z.input<typeof updateOwnNameSchema>
): Promise<MutationResult> {
  const session = await requireDm();

  const parsed = updateOwnNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  try {
    await prisma.users.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    });
  } catch (error) {
    throw toDatabaseError("renaming the signed-in account", error);
  }

  revalidateDashboard("account");
  return { ok: true };
}
