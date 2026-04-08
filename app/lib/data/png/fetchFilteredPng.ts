import prisma from "../../connections/prisma";
import PngItem from "../../definitions/interfaces/png/PngItem";
import getQuery from "../getQuery";
import PngMetaField from "../../definitions/enums/png/PngMetaField";

export async function fetchFilteredPng(
  searchParams: Record<string, any>
): Promise<PngItem[]> {
  const theParams = await searchParams;
  const theQuery = await getQuery(theParams, [
    PngMetaField.nome,
    PngMetaField.descrizione,
    PngMetaField.titolo,
    PngMetaField.allineamento,
    PngMetaField.dominioAllineamento,
    PngMetaField.mansione,
    PngMetaField.luogo,
    PngMetaField.fazione,
    PngMetaField.aspetto,
    PngMetaField.personalita,
    PngMetaField.motivazioni,
    PngMetaField.segreti,
  ]);

  try {
    const result = await prisma.png.findMany(theQuery);
    return result as PngItem[];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch png.");
  }
}
