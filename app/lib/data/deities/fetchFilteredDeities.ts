import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import Patrono from "../../definitions/interfaces/deities/Patrono";
import PatronoMetaField from "../../definitions/enums/deities/PatronoMetaField";

export async function fetchFilteredDeities(
  searchParams: Record<string, any>
): Promise<Patrono[]> {
  const theParams = await searchParams;
  const theQuery = await getQuery(theParams, [
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
  ]);

  try {
    const result = await prisma.deities.findMany(theQuery);
    return result as Patrono[];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch deities.");
  }
}
