import DatabaseError from "@/app/lib/errors/DatabaseError";
import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import Patrono from "../../definitions/interfaces/deities/Patrono";
import PatronoMetaField from "../../definitions/enums/deities/PatronoMetaField";

export async function fetchFilteredDeities(
  searchParams: SearchParamsInput
): Promise<Patrono[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.deitiesWhereInput>(theParams, [
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
    throw new DatabaseError("fetching deities", error);
  }
}
