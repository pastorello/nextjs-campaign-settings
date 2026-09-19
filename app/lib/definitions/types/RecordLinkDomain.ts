/**
 * The record domains a formatted-text link may point at (SPEC-019, ADR-0016):
 * SPEC-011's six searchable domains, spelled exactly as `SEARCH_DOMAINS`.
 *
 * These strings are **stored data** — they sit in `data-record-domain` on every
 * saved link — so renaming one is a data migration, not a refactor. Declared
 * here rather than imported from `searchAllDomains.ts` because the renderer
 * runs in client components and that module pulls in Prisma;
 * `RecordLinkDomain.test.ts` keeps the two lists equal.
 */
export const RECORD_LINK_DOMAINS = [
  "spells",
  "magicItems",
  "npc",
  "deities",
  "factions",
  "places",
] as const;

type RecordLinkDomain = (typeof RECORD_LINK_DOMAINS)[number];

export function isRecordLinkDomain(value: unknown): value is RecordLinkDomain {
  return (
    typeof value === "string" &&
    (RECORD_LINK_DOMAINS as readonly string[]).includes(value)
  );
}

export default RecordLinkDomain;
