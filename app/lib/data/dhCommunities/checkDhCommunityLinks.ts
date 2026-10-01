import fieldError from "@/app/lib/data/validation/fieldError";
import prisma from "@/app/lib/connections/prisma";
import DhCommunityMetaField from "@/app/lib/definitions/enums/daggerheart/DhCommunityMetaField";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * A community's links must name places and factions that exist (SPEC-027
 * T3): a connect to a missing row would fail the whole write. Each missing
 * kind is a field error on its own field; nothing to check is no error.
 */
export default async function checkDhCommunityLinks(
  placeIds: number[] | undefined,
  factionIds: number[] | undefined
): Promise<FieldErrors | null> {
  const places = [...new Set(placeIds ?? [])];
  const factions = [...new Set(factionIds ?? [])];
  let foundPlaces = 0;
  let foundFactions = 0;
  try {
    [foundPlaces, foundFactions] = await Promise.all([
      places.length > 0
        ? prisma.zone.count({ where: { id: { in: places } } })
        : 0,
      factions.length > 0
        ? prisma.faction.count({ where: { id: { in: factions } } })
        : 0,
    ]);
  } catch (error) {
    throw toDatabaseError("checking a community's links", error);
  }

  const errors: FieldErrors = {
    ...(foundPlaces < places.length && {
      [DhCommunityMetaField.placeIds]: [fieldError("placeNotFound")],
    }),
    ...(foundFactions < factions.length && {
      [DhCommunityMetaField.factionIds]: [fieldError("factionNotFound")],
    }),
  };
  return Object.keys(errors).length > 0 ? errors : null;
}
