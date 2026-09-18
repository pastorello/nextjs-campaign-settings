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
import findWorldHistoryEvent from "./findWorldHistoryEvent";
import toWorldHistoryEventWrite from "./toWorldHistoryEventWrite";

/**
 * Edits a world history event (SPEC-014 §5.4, T5). The form sends every
 * field, so this replaces them all — the links included, with `set`, so a
 * link the DM removed is dropped. A campaign event is not world history:
 * naming one here is a not-found, the same as naming no event at all.
 */
export default async function updateWorldHistoryEvent(
  id: number,
  input: WorldHistoryEventInput
): Promise<MutationResult> {
  await requireSession();

  const parsed = worldHistoryEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const eventId = await findWorldHistoryEvent(id);

  const missing = await findMissingEventLinks(parsed.data);
  if (Object.keys(missing).length > 0) return { ok: false, errors: missing };

  const { scalars, links } = toWorldHistoryEventWrite(parsed.data);
  try {
    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...scalars,
        zones: { set: links.zones },
        npcs: { set: links.npcs },
        deities: { set: links.deities },
        factions: { set: links.factions },
      },
    });
  } catch (error) {
    throw toDatabaseError("updating world history event", error);
  }

  revalidateDashboard("world/history");
  return { ok: true };
}
