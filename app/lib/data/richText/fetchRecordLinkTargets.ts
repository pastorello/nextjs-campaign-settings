import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import {
  isPlayerSearchDomain,
  isSearchDomainInSystem,
} from "@/app/lib/data/search/searchAllDomains";
import type RecordLinkDomain from "@/app/lib/definitions/types/RecordLinkDomain";
import type RecordLinkTargets from "@/app/lib/definitions/types/RecordLinkTargets";
import type VisibilityScope from "@/app/lib/data/visibility/VisibilityScope";
import collectRecordLinks from "@/app/lib/utils/richText/collectRecordLinks";
import recordLinkKey from "@/app/lib/utils/richText/recordLinkKey";

type NamedRow = { id: number; name: string };

/** The domains revealed record by record (SPEC-022 T6a). */
const REVEALED_DOMAINS = ["magicItems", "npc", "deities", "factions"] as const;
type RevealedDomain = (typeof REVEALED_DOMAINS)[number];

const isRevealedDomain = (domain: RecordLinkDomain): domain is RevealedDomain =>
  (REVEALED_DOMAINS as readonly string[]).includes(domain);

const FIND_REVEALED: Record<
  RevealedDomain,
  (ids: number[], campaignId: number) => Promise<{ id: number }[]>
> = {
  magicItems: (ids, campaignId) =>
    prisma.magicitems.findMany({
      where: { id: { in: ids }, revealedTo: { some: { id: campaignId } } },
      select: { id: true },
    }),
  npc: (ids, campaignId) =>
    prisma.npc.findMany({
      where: { id: { in: ids }, revealedTo: { some: { id: campaignId } } },
      select: { id: true },
    }),
  deities: (ids, campaignId) =>
    prisma.deities.findMany({
      where: { id: { in: ids }, revealedTo: { some: { id: campaignId } } },
      select: { id: true },
    }),
  factions: (ids, campaignId) =>
    prisma.faction.findMany({
      where: { id: { in: ids }, revealedTo: { some: { id: campaignId } } },
      select: { id: true },
    }),
};

/** The linked ids each revealed domain has shown the campaign. */
async function fetchRevealedIds(
  idsByDomain: ReadonlyMap<RecordLinkDomain, number[]>,
  campaignId: number | null
): Promise<Map<RecordLinkDomain, Set<number>>> {
  const revealed = new Map<RecordLinkDomain, Set<number>>();
  if (campaignId === null) return revealed;
  try {
    for (const [domain, ids] of idsByDomain) {
      if (!isRevealedDomain(domain)) continue;
      const rows = await FIND_REVEALED[domain](ids, campaignId);
      revealed.set(domain, new Set(rows.map(({ id }) => id)));
    }
  } catch (error) {
    throw toDatabaseError("reading which linked records are revealed", error);
  }
  return revealed;
}

function isLinkVisible(
  domain: RecordLinkDomain,
  id: number,
  scope: VisibilityScope,
  revealed: ReadonlyMap<RecordLinkDomain, Set<number>> | null
): boolean {
  if (scope.kind === "all") return true;
  if (domain === "places") return scope.zones.has(id);
  if (isRevealedDomain(domain)) return revealed?.get(domain)?.has(id) ?? false;
  return true;
}

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
  // SPEC-021 T7 — resolved only under `daggerheart`, like their search.
  dhDomains: (ids) =>
    prisma.dhDomain.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  dhDomainCards: (ids) =>
    prisma.dhDomainCard.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  dhClasses: (ids) =>
    prisma.dhClass.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  dhSubclasses: (ids) =>
    prisma.dhSubclass.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  // SPEC-027 T4.
  dhAncestries: (ids) =>
    prisma.dhAncestry.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  dhCommunities: (ids) =>
    prisma.dhCommunity.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  // SPEC-028 T4.
  dhAdversaries: (ids) =>
    prisma.dhAdversary.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
  dhEnvironments: (ids) =>
    prisma.dhEnvironment.findMany({
      ...byIds(ids),
      select: { id: true, name: true },
    }),
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
  system: string,
  // Required, never defaulted to the DM's: a caller that forgets the reader
  // would leak every hidden record's name (SPEC-022 T7).
  scope: VisibilityScope
): Promise<RecordLinkTargets> {
  const idsByDomain = new Map<RecordLinkDomain, number[]>();
  for (const { domain, id } of collectRecordLinks(values)) {
    if (!isSearchDomainInSystem(domain, system)) continue;
    // The DM's prep (SPEC-028 §9 decision 3) is not even read for a player:
    // a link to it renders as its text.
    if (scope.kind === "campaign" && !isPlayerSearchDomain(domain)) continue;
    idsByDomain.set(domain, [...(idsByDomain.get(domain) ?? []), id]);
  }

  // SPEC-022 T7 (R13): under a player's scope, a link to a record their
  // campaign has not been shown resolves to nothing and renders as its
  // text. Places follow the visible tree, and the revealed-one-by-one
  // domains their reveals. The rules catalogues are visible to every player.
  const revealed =
    scope.kind === "campaign"
      ? await fetchRevealedIds(idsByDomain, scope.campaignId)
      : null;

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
    for (const { id, name } of rows) {
      if (isLinkVisible(domain, id, scope, revealed)) {
        targets[recordLinkKey(domain, id)] = name;
      }
    }
  }
  return targets;
}
