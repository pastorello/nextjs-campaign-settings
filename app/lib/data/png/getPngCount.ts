import prisma from "../../connections/prisma";
import PngMetaField from "../../definitions/enums/png/PngMetaField";
import { getItemsCount, ItemCount } from "../getItemsCount";
import { SearchParamsInput } from "../validateParams";

export async function getPngCount(
  searchParams: SearchParamsInput
): Promise<ItemCount> {
  const result: ItemCount = await getItemsCount(
    searchParams,
    [
      PngMetaField.dominioAllineamento,
      PngMetaField.allineamento,
      PngMetaField.fazione,
      PngMetaField.luogo,
    ],
    prisma.png
  );

  return result;
}
