"use server";

import z from "zod";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import { accountIdSchema } from "@/app/lib/data/validation/accountSchemas";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

import leavesNoActiveDm from "./leavesNoActiveDm";

const deleteAccountSchema = z.object({ id: accountIdSchema });

/**
 * Deletes an account (SPEC-022 T3). Its open session ends at its next
 * request. Deleting the last active DM is refused (§5).
 */
export default async function deleteAccount(
  input: z.input<typeof deleteAccountSchema>
): Promise<MutationResult> {
  await requireDm();

  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { id } = parsed.data;

  let result: MutationResult;
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const exists = await tx.users.count({ where: { id } });
        if (!exists) {
          return { ok: false, errors: { id: [fieldError("accountNotFound")] } };
        }
        if (await leavesNoActiveDm(tx, id)) {
          return { ok: false, errors: { id: [fieldError("lastActiveDm")] } };
        }
        await tx.users.delete({ where: { id } });
        return { ok: true };
      },
      { isolationLevel: "Serializable" }
    );
  } catch (error) {
    throw toDatabaseError("deleting an account", error);
  }

  if (result.ok) revalidateDashboard("admin/accounts");
  return result;
}
