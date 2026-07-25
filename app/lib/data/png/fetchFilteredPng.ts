import prisma from "../../connections/prisma";
import PngItem from "../../definitions/interfaces/png/PngItem";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import PngMetaField from "../../definitions/enums/png/PngMetaField";

export async function fetchFilteredPng(
  searchParams: SearchParamsInput
): Promise<PngItem[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.pngWhereInput>(theParams, [
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
