import type MetaValue from "./MetaValue";

/**
 * The shapes `getQuery` builds. They are intentionally structural: `getQuery` is
 * polymorphic across the four domains, so it produces a generic `where`, and the
 * caller narrows it to a specific `Prisma.<model>WhereInput` via `getQuery`'s
 * type parameter. Prisma's where inputs accept these structurally.
 */

/** One field condition in a where clause. */
export type WhereCondition =
  | MetaValue
  | { hasSome: MetaValue[] }
  | { contains: string; mode: "insensitive" };

/** A where clause keyed by field name. */
export type WhereClause = Record<string, WhereCondition>;

/** A single order-by term, e.g. `{ name: "asc" }`. */
export type OrderByClause = Record<string, "asc" | "desc">;

/** The full query object handed to Prisma's `findMany`. */
export interface Query<TWhere> {
  where: TWhere;
  skip: number;
  take: number;
  orderBy: OrderByClause[];
}
