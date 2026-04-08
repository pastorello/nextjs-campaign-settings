import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import MagicItemMetaField from "../../definitions/enums/magicitem/MagicItemMetaField";

export async function fetchFilteredMagicItems(
  searchParams: Record<string, any>
): Promise<MagicItem[]> {
  const theParams = await searchParams;
  const theQuery = getQuery(theParams, [
    MagicItemMetaField.rarita,
    MagicItemMetaField.tipo,
    MagicItemMetaField.sintonia,
  ]);

  try {
    const magicItems = await prisma.magicitems.findMany(theQuery);
    return magicItems.map((item) => ({
      ...item,
      sintonia: item.sintonia === true,
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch magic items.");
  }
}
