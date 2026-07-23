import { z, ZodRawShape } from "zod";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import FieldType from "../definitions/types/FieldType";
import isKeyOfItem from "../utils/validators/isKeyOfItem";
import pageMetaFields, { fieldMeta } from "../config/pageMetaFields";

const zodConfig: Record<FieldType, any> = {
  [FieldType.integer]: z.coerce
    .number()
    .transform((val) => (val >= 0 ? val : null))
    .nullable()
    .catch(null),
  [FieldType.array]: z
    .string()
    .nullable()
    .catch(null)
    .transform((val) => (val ? JSON.parse(val) : null)),
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

type SearchParams = {
  query?: string | null;
  sort?: string | null;
  page?: number | null;
  sortFields?: Record<string, "asc" | "desc"> | null;
} & {
  [K in MetaConfigKey]: boolean | number | string | null;
};

const getParamsSchema = (aQuery: Record<string, any>): ZodRawShape => {
  const paramsSchema: Record<string, any> = {
    sortFields: z
      .string()
      .nullable()
      .catch(null)
      .transform((val) => (val ? JSON.parse(val) : null)),
    sort: z.string().nullable().catch(null),
    query: z.string().nullable().catch(null),
    page: z.coerce
      .number()
      .transform((val) => (val >= 1 ? val : 1))
      .catch(1),
  };

  Object.keys(aQuery).forEach((item: string) => {
    if (isKeyOfItem(item, pageMetaFields)) {
      paramsSchema[item] = zodConfig[fieldMeta[item].fieldType];
    }
  });

  return paramsSchema;
};

export default function validateParams(
  query: Record<string, any>
): SearchParams {
  const schema = getParamsSchema(query);
  // The shape is assembled at runtime from whichever keys the query carries,
  // so Zod can only infer `Record<string, unknown>` here. The values really are
  // `string | number | boolean | null` — every branch of `zodConfig` produces
  // one — but proving that statically needs the typed metadata keys from TD-08,
  // which is where this assertion should be deleted.
  return z.object(schema).parse(query) as SearchParams;
}
