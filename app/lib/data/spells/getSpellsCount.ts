import prisma from "../../connections/prisma";
import SpellMetaField from "../../definitions/enums/spells/SpellMetaField";
import { getItemsCount, ItemCount } from "../getItemsCount";

export async function getSpellsCount(
  searchParams: Record<string, any>
): Promise<ItemCount> {
  const result: ItemCount = await getItemsCount(
    searchParams,
    [
      SpellMetaField.livello,
      SpellMetaField.circolo,
      SpellMetaField.classi,
      SpellMetaField.sottoClassi,
      SpellMetaField.tempoDiLancio,
      SpellMetaField.gittata,
      SpellMetaField.componenti,
      SpellMetaField.durata,
      SpellMetaField.tiroSalvezza,
      SpellMetaField.rituale,
      SpellMetaField.concentrazione,
      SpellMetaField.descrizione,
      SpellMetaField.intensificato,
    ],
    prisma.spells
  );

  return result;
}
