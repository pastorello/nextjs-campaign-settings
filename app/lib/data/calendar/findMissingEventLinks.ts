import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import fieldError from "@/app/lib/data/validation/fieldError";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";

interface EventLinks {
  zoneIds: number[];
  npcIds: number[];
  deityIds: number[];
  factionIds: number[];
}

type IdLookup = (ids: number[]) => Promise<{ id: number }[]>;

const lookups: {
  field: keyof EventLinks;
  lookup: IdLookup;
  refusal: Parameters<typeof fieldError>[0];
}[] = [
  {
    field: "zoneIds",
    lookup: (ids) =>
      prisma.zone.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      }),
    refusal: "zoneNotFound",
  },
  {
    field: "npcIds",
    lookup: (ids) =>
      prisma.npc.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    refusal: "npcNotFound",
  },
  {
    field: "deityIds",
    lookup: (ids) =>
      prisma.deities.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      }),
    refusal: "deityNotFound",
  },
  {
    field: "factionIds",
    lookup: (ids) =>
      prisma.faction.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      }),
    refusal: "factionNotFound",
  },
];

/**
 * A world history event's links that name no row (SPEC-014 §5.4), as field
 * errors on the link list that holds them — empty when every id exists.
 * Checked before the write rather than left to Prisma's `connect`, which
 * would throw for a missing row and reach the DM as a generic save failure
 * instead of "this NPC does not exist" on the field.
 */
export default async function findMissingEventLinks(
  links: EventLinks
): Promise<FieldErrors> {
  const errors: FieldErrors = {};

  for (const { field, lookup, refusal } of lookups) {
    const ids = [...new Set(links[field])];
    if (ids.length === 0) continue;

    let found;
    try {
      found = await lookup(ids);
    } catch (error) {
      throw toDatabaseError(`checking the event's ${field}`, error);
    }

    if (found.length < ids.length) errors[field] = [fieldError(refusal)];
  }

  return errors;
}
