import validateParams from "./validateParams";
import MetaConfigKey from "../definitions/types/MetaConfigKey";
import pageMetaFields from "../config/pageMetaFields";
import FieldType from "../definitions/types/FieldType";
import isValidString from "../utils/validators/isValidString";
import { DEFAULT_ITEMS_PER_PAGE } from "../config/constants";
import { sendErrorNotification } from "../actions/notifications/sendNotification";

const paramValidator: Record<FieldType, (aValue: any) => boolean> = {
  [FieldType.integer]: (aValue: number | string) => Number(aValue) >= 0,
  [FieldType.array]: (aValue: number | string) => Number(aValue) >= 0,
  [FieldType.string]: (aValue: any) => isValidString(aValue),
  [FieldType.boolean]: (aValue: any) =>
    aValue === "true" || aValue === true || aValue === 1 || aValue === "1",
};

export default function getQuery(
  searchParams: Record<string, any>,
  enabledMeta: MetaConfigKey[],
  itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE
) {
  const validatedParams = validateParams(searchParams);
  const whereClause: any = {};

  if (validatedParams.query) {
    whereClause.nome = {
      contains: validatedParams.query,
      mode: "insensitive",
    };
  }

  enabledMeta.forEach((item: MetaConfigKey) => {
    if (!pageMetaFields[item]) {
      sendErrorNotification(
        `fail item: ${item} validated: ${validatedParams[item]}`
      );
    }

    const fieldType = pageMetaFields[item].fieldType;

    if (
      validatedParams[item] !== null &&
      paramValidator[fieldType](validatedParams[item])
    ) {
      whereClause[item] =
        fieldType === FieldType.array
          ? { hasSome: [validatedParams[item]] }
          : validatedParams[item];
    }
  });

  const actualPage = validatedParams.page || 1;
  const orderBy: any[] = [];

  if (validatedParams.sortFields) {
    for (const [field, direction] of Object.entries(
      validatedParams.sortFields
    )) {
      orderBy.push({ [field]: direction });
    }
  }

  orderBy.push({ nome: validatedParams.sort === "desc" ? "desc" : "asc" });

  const theQuery = {
    where: whereClause,
    skip: itemsPerPage * (actualPage - 1),
    take: itemsPerPage,
    orderBy: orderBy,
  };

  return theQuery;
}
