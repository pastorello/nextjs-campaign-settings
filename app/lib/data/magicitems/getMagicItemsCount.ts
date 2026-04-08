import prisma from "../../connections/prisma";
import MagicItemMetaField from "../../definitions/enums/magicitem/MagicItemMetaField";
import { getItemsCount, ItemCount } from "../getItemsCount";

export async function getMagicItemsCount(
  searchParams: Record<string, any>
): Promise<ItemCount> {
  const result: ItemCount = await getItemsCount(
    searchParams,
    [
      MagicItemMetaField.rarita,
      MagicItemMetaField.tipo,
      MagicItemMetaField.sintonia,
    ],
    prisma.magicitems
  );

  return result;
}
