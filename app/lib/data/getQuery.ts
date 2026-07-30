import validateParams, { RawSearchParams } from "./validateParams";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import pageMetaFields from "../config/pageMetaFields";
import FieldType from "../definitions/types/FieldType";
import isValidString from "../utils/validators/isValidString";
import { DEFAULT_ITEMS_PER_PAGE } from "../config/constants";
import logServerIssue from "../notifications/logServerIssue";
import type {
  WhereClause,
  OrderByClause,
  Query,
} from "../definitions/types/QueryClauses";

const paramValidator: Record<FieldType, (aValue: unknown) => boolean> = {
  [FieldType.integer]: (aValue) => Number(aValue) >= 0,
  [FieldType.array]: (aValue) => Number(aValue) >= 0,
  [FieldType.string]: (aValue) => isValidString(aValue),
  [FieldType.boolean]: (aValue) =>
    aValue === "true" || aValue === true || aValue === 1 || aValue === "1",
};

/**
 * Builds a Prisma `{ where, skip, take, orderBy }` from validated search params
 * and the fields a page enables.
 *
 * `getQuery` is polymorphic across the four domains, so it constructs a generic
 * `WhereClause`. A caller narrows it to a specific model by supplying the type
 * parameter — `getQuery<Prisma.spellsWhereInput>(…)` — which Prisma's structural
 * where inputs accept. The single `as TWhere` below is that one narrowing.
 */
export default function getQuery<TWhere = WhereClause>(
  searchParams: RawSearchParams,
  enabledMeta: MetaConfigKey[],
  itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE
): Query<TWhere> {
  const validatedParams = validateParams(searchParams);
  const whereClause: WhereClause = {};

  if (validatedParams.query) {
    whereClause.name = {
      contains: validatedParams.query,
      mode: "insensitive",
    };
  }

  enabledMeta.forEach((item: MetaConfigKey) => {
    if (!pageMetaFields[item]) {
      // A key in `enabledMeta` with no declaration is a programming error, not
      // something a user can act on — and this runs on the server anyway.
      logServerIssue(
        `getQuery: no metadata declared for field "${item}" (value: ${String(
          validatedParams[item]
        )})`
      );
    }

    const fieldType = pageMetaFields[item].fieldType;
    // `item` is a metadata field key, so this is the mapped half of
    // SearchParams: string | number | boolean | null.
    const value = validatedParams[item];

    if (
      value !== null &&
      value !== undefined &&
      paramValidator[fieldType](value)
    ) {
      whereClause[item] =
        fieldType === FieldType.array ? { hasSome: [value] } : value;
    }
  });

  const actualPage = validatedParams.page || 1;
  const orderBy: OrderByClause[] = [];

  if (validatedParams.sortFields) {
    for (const [field, direction] of Object.entries(
      validatedParams.sortFields
    )) {
      orderBy.push({ [field]: direction });
    }
  }

  orderBy.push({ name: validatedParams.sort === "desc" ? "desc" : "asc" });

  return {
    where: whereClause as TWhere,
    skip: itemsPerPage * (actualPage - 1),
    take: itemsPerPage,
    orderBy,
  };
}
