import prisma from "../../connections/prisma";
import PatronoMetaField from "../../definitions/enums/deities/PatronoMetaField";
import { getItemsCount, ItemCount } from "../getItemsCount";

export async function getDeitiesCount(
  searchParams: Record<string, any>
): Promise<ItemCount> {
  const result: ItemCount = await getItemsCount(
    searchParams,
    [
      PatronoMetaField.nome,
      PatronoMetaField.titoloPatrono,
      PatronoMetaField.tipoPatrono,
      PatronoMetaField.gradoPatrono,
      PatronoMetaField.card,
      PatronoMetaField.astri,
      PatronoMetaField.elemento,
      PatronoMetaField.classe,
      PatronoMetaField.festivita,
      PatronoMetaField.colore,
      PatronoMetaField.tradizione,
      PatronoMetaField.allineamento,
      PatronoMetaField.dominioAllineamento,
      PatronoMetaField.residenza,
      PatronoMetaField.luogo,
      PatronoMetaField.significato,
    ],
    prisma.deities
  );

  return result;
}
