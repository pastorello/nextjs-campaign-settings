import type { OrderByClause } from "../../definitions/types/QueryClauses";

/** One order-by term once `location`'s entry is translated, if present. */
export type LocationOrderByClause =
  OrderByClause | { zone: { title: "asc" | "desc" } };

/**
 * Replaces a `{ location: direction }` entry — what `getQuery`'s generic
 * loop produces for the "Location" column's sort click — with a real
 * `ORDER BY zone.title` (§5). `npc`/`deities` have no `location` column at
 * all (SPEC-004 T5b dropped it), so passing `getQuery`'s output straight to
 * Prisma would throw; this is the one place that translation happens,
 * keyed on `zoneId` per §7 even though the column itself is named
 * `location`.
 */
export default function applyLocationSort(
  orderBy: OrderByClause[]
): LocationOrderByClause[] {
  return orderBy.map((clause) =>
    "location" in clause ? { zone: { title: clause.location } } : clause
  );
}
