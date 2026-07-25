import prisma from "../../connections/prisma";
import getQuery from "../getQuery";
import { SearchParamsInput } from "../validateParams";
import { Prisma } from "@/generated/prisma/client";
import SpellMetaField from "../../definitions/enums/spells/SpellMetaField";
import Spell from "../../definitions/interfaces/spells/Spell";

export async function fetchFilteredSpells(
  searchParams: SearchParamsInput
): Promise<Spell[]> {
  const theParams = await searchParams;
  const theQuery = getQuery<Prisma.spellsWhereInput>(theParams, [
    SpellMetaField.nome,
    SpellMetaField.livello,
    SpellMetaField.circolo,
    SpellMetaField.classi,
    SpellMetaField.tempoDiLancio,
    SpellMetaField.gittata,
    SpellMetaField.componenti,
    SpellMetaField.durata,
    SpellMetaField.tiroSalvezza,
    SpellMetaField.rituale,
    SpellMetaField.concentrazione,
    SpellMetaField.descrizione,
    SpellMetaField.intensificato,
  ]);

  try {
    const result = await prisma.spells.findMany(theQuery);
    return result as Spell[];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch spells.");
  }
}
