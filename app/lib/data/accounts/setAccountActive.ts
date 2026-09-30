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

const setAccountActiveSchema = z.object({
  id: accountIdSchema,
  active: z.boolean(),
});

/**
 * Disables an account, or activates one (SPEC-022 T3): re-enabling a
 * disabled account and activating a DM's self-service sign-up (T4) are the
 * same write. A disabled account cannot sign in, and an open session ends at
 * its next request. Disabling the last active DM is refused (§5).
 */
export default async function setAccountActive(
  input: z.input<typeof setAccountActiveSchema>
): Promise<MutationResult> {
  await requireDm();

  const parsed = setAccountActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }
  const { id, active } = parsed.data;

  let result: MutationResult;
  try {
    result = await prisma.$transaction(
      async (tx) => {
        const exists = await tx.users.count({ where: { id } });
        if (!exists) {
          return { ok: false, errors: { id: [fieldError("accountNotFound")] } };
        }
        if (!active && (await leavesNoActiveDm(tx, id))) {
          return {
            ok: false,
            errors: { active: [fieldError("lastActiveDm")] },
          };
        }
        await tx.users.update({ where: { id }, data: { active } });
        return { ok: true };
      },
      { isolationLevel: "Serializable" }
    );
  } catch (error) {
    throw toDatabaseError("changing whether an account is active", error);
  }

  if (result.ok) revalidateDashboard("admin/accounts");
  return result;
}
