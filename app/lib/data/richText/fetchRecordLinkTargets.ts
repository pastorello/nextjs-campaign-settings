import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { isSearchDomainInSystem } from "@/app/lib/data/search/searchAllDomains";
import type RecordLinkDomain from "@/app/lib/definitions/types/RecordLinkDomain";
import type RecordLinkTargets from "@/app/lib/definitions/types/RecordLinkTargets";
import collectRecordLinks from "@/app/lib/utils/richText/collectRecordLinks";
import recordLinkKey from "@/app/lib/utils/richText/recordLinkKey";

type NamedRow = { id: number; name: string };

const byIds = (ids: number[]) => ({ where: { id: { in: ids } } });

/** One batched read per domain: the rows among `ids` that still exist. */
const FIND_EXISTING: Record<
  RecordLinkDomain,
  (ids: number[]) => Promise<NamedRow[]>
> = {
  spells: (ids) =>
    prisma.spells.findMany({ ...byIds(ids), select: { id: true, name: true } }),
  magicItems: (ids) =>
    prisma.magicitems.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  npc: (ids) =>
    prisma.npc.findMany({ ...byIds(ids), select: { id: true, name: true } }),
  deities: (ids) =>
    prisma.deities.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  factions: (ids) =>
    prisma.faction.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  // Places are `zone` rows, as in `searchPlacesByTitle`.
  places: async (ids) =>
    (
      await prisma.zone.findMany({
        ...byIds(ids),
        select: { id: true, title: true },
      })
    ).map(({ id, title }) => ({ id, name: title })),
};

/**
 * Resolves the record links in a page's formatted descriptions (SPEC-019 T2,
 * ADR-0016): collects every link across `values`, then reads each linked
 * domain once (`id IN (…)`), so a page costs at most one query per domain it
 * links to — none when nothing links. The result names each record that still
 * exists **and** belongs to the route's game system (ADR-0013 rule 10); every
 * other link renders as plain text.
 *
 * Server-only (Prisma). Called by a page's Server Component, which hands the
 * result to `RecordLinkTargetsProvider` above the rendered descriptions.
 */
export default async function fetchRecordLinkTargets(
  values: readonly (string | null | undefined)[],
  system: string
): Promise<RecordLinkTargets> {
  const idsByDomain = new Map<RecordLinkDomain, number[]>();
  for (const { domain, id } of collectRecordLinks(values)) {
    if (!isSearchDomainInSystem(domain, system)) continue;
    idsByDomain.set(domain, [...(idsByDomain.get(domain) ?? []), id]);
  }

  let groups;
  try {
    groups = await Promise.all(
      [...idsByDomain].map(
        async ([domain, ids]) =>
          [domain, await FIND_EXISTING[domain](ids)] as const
      )
    );
  } catch (error) {
    throw toDatabaseError("resolving record links", error);
  }

  const targets: Record<string, string> = {};
  for (const [domain, rows] of groups) {
    for (const { id, name } of rows) targets[recordLinkKey(domain, id)] = name;
  }
  return targets;
}
