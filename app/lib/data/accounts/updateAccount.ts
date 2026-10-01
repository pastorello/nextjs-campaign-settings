"use server";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import {
  updateAccountSchema,
  type UpdateAccountInput,
} from "@/app/lib/data/validation/accountSchemas";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

import leavesNoActiveDm from "./leavesNoActiveDm";

/**
 * Renames an account and sets its role (SPEC-022 T3). Demoting the last
 * active DM is refused: there is always one (§5).
 */
export default async function updateAccount(
  input: UpdateAccountInput
): Promise<MutationResult> {
  await requireDm();

  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { id, name, role } = parsed.data;

  let result: MutationResult;
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const exists = await tx.users.count({ where: { id } });
        if (!exists) {
          return { ok: false, errors: { id: [fieldError("accountNotFound")] } };
        }
        if (role !== "dm" && (await leavesNoActiveDm(tx, id))) {
          return { ok: false, errors: { role: [fieldError("lastActiveDm")] } };
        }
        await tx.users.update({ where: { id }, data: { name, role } });
        return { ok: true };
      },
      { isolationLevel: "Serializable" }
    );
  } catch (error) {
    throw toDatabaseError("updating an account", error);
  }

  if (result.ok) revalidateDashboard("admin/accounts");
  return result;
}
