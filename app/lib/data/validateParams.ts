import { z, ZodRawShape, ZodTypeAny } from "zod";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import FieldType from "../definitions/types/FieldType";
import isKeyOfItem from "../utils/validators/isKeyOfItem";
import pageMetaFields, { fieldMeta } from "../config/pageMetaFields";

/** The raw, untrusted query record before validation — every value a string. */
export type RawSearchParams = Record<string, string | undefined>;

/**
 * What a data-layer entry point accepts. Next passes `searchParams` as a
 * Promise, and some call sites await it first while others pass it through, so
 * both shapes reach here. Awaiting a non-promise is a no-op, so `await`-ing the
 * argument once inside covers both.
 */
export type SearchParamsInput = RawSearchParams | Promise<RawSearchParams>;

const zodConfig: Record<FieldType, ZodTypeAny> = {
  [FieldType.integer]: z.coerce
    .number()
    .transform((val) => (val >= 0 ? val : null))
    .nullable()
    .catch(null),
  [FieldType.array]: z
    .string()
    .nullable()
    .catch(null)
    .transform((val) => (val ? (JSON.parse(val) as unknown) : null)),
  [FieldType.string]: z.string().nullable().catch(null),
  [FieldType.boolean]: z.preprocess(
    (val) =>
      val === "true" || val === true || val === 1
        ? true
        : val === "false" || val === false || val === 0
          ? false
          : null,
    z.boolean().nullable().catch(null)
  ),
};

export type SearchParams = {
  query?: string | null;
  sort?: string | null;
  page?: number | null;
  sortFields?: Record<string, "asc" | "desc"> | null;
} & {
  [K in MetaConfigKey]: boolean | number | string | null;
};

const getParamsSchema = (aQuery: RawSearchParams): ZodRawShape => {
  const paramsSchema: Record<string, ZodTypeAny> = {
    sortFields: z
      .string()
      .nullable()
      .catch(null)
      .transform((val) => (val ? (JSON.parse(val) as unknown) : null)),
    sort: z.string().nullable().catch(null),
    query: z.string().nullable().catch(null),
    page: z.coerce
      .number()
      .transform((val) => (val >= 1 ? val : 1))
      .catch(1),
  };

  Object.keys(aQuery).forEach((item: string) => {
    if (isKeyOfItem(item, pageMetaFields)) {
      const fieldType = fieldMeta[item]?.fieldType;

      if (fieldType) paramsSchema[item] = zodConfig[fieldType];
    }
  });

  return paramsSchema;
};

export default function validateParams(query: RawSearchParams): SearchParams {
  const schema = getParamsSchema(query);
  // The schema is assembled at runtime from whichever keys the query carries, so
  // Zod infers `Record<string, …>` rather than the exact SearchParams shape. The
  // values are correct by construction — every zodConfig branch yields
  // `string | number | boolean | null` — but only a runtime-built schema could
  // prove it, so this stays a single documented assertion.
  return z.object(schema).parse(query) as SearchParams;
}
