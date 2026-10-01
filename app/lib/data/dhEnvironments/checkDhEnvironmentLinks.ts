import fieldError from "@/app/lib/data/validation/fieldError";
import prisma from "@/app/lib/connections/prisma";
import DhEnvironmentMetaField from "@/app/lib/definitions/enums/daggerheart/DhEnvironmentMetaField";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * An environment's links must name adversaries and places that exist
 * (SPEC-028 T3): a link to a missing row would fail the whole write. Each
 * missing kind is a field error on its own field.
 */
export default async function checkDhEnvironmentLinks(
  adversaryIds: number[] | undefined,
  placeIds: number[] | undefined
): Promise<FieldErrors | null> {
  const adversaries = [...new Set(adversaryIds ?? [])];
  const places = [...new Set(placeIds ?? [])];
  let foundAdversaries = 0;
  let foundPlaces = 0;
  try {
    [foundAdversaries, foundPlaces] = await Promise.all([
      adversaries.length > 0
        ? prisma.dhAdversary.count({ where: { id: { in: adversaries } } })
        : 0,
      places.length > 0
        ? prisma.zone.count({ where: { id: { in: places } } })
        : 0,
    ]);
  } catch (error) {
    throw toDatabaseError("checking an environment's links", error);
  }

  const errors: FieldErrors = {
    ...(foundAdversaries < adversaries.length && {
      [DhEnvironmentMetaField.adversaryIds]: [fieldError("adversaryNotFound")],
    }),
    ...(foundPlaces < places.length && {
      [DhEnvironmentMetaField.placeIds]: [fieldError("placeNotFound")],
    }),
  };
  return Object.keys(errors).length > 0 ? errors : null;
}
