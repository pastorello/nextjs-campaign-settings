"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import worldHistoryEventSchema from "@/app/lib/data/validation/worldHistoryEventSchema";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import WorldHistoryEventInput from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEventInput";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";
import findMissingEventLinks from "./findMissingEventLinks";
import toWorldHistoryEventWrite from "./toWorldHistoryEventWrite";

/**
 * Adds an event to the world's history (SPEC-014 §5.4, T5): an event with
 * no campaign, linking any number of places, NPCs, deities and factions.
 * Auth first, then the schema (the fields and the date rules), then that
 * every linked row exists — each refusal a field error, keyed (TD-124).
 */
export default async function createWorldHistoryEvent(
  input: WorldHistoryEventInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = worldHistoryEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const missing = await findMissingEventLinks(parsed.data);
  if (Object.keys(missing).length > 0) return { ok: false, errors: missing };

  const { scalars, links } = toWorldHistoryEventWrite(parsed.data);
  try {
    await prisma.calendarEvent.create({
      data: {
        ...scalars,
        zones: { connect: links.zones },
        npcs: { connect: links.npcs },
        deities: { connect: links.deities },
        factions: { connect: links.factions },
      },
    });
  } catch (error) {
    throw toDatabaseError("creating world history event", error);
  }

  revalidateDashboard("world/history");
  return { ok: true };
}
