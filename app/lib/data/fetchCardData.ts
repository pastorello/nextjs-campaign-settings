import DatabaseError from "@/app/lib/errors/DatabaseError";
import prisma from "@/app/lib/connections/prisma";

export default async function fetchCardData() {
  try {
    const [numberOfmagicItems, numberOfPng, numberOfSpells, numberOfDeities] =
      await prisma.$transaction([
        prisma.magicitems.count(),
        prisma.png.count(),
        prisma.spells.count(),
        prisma.deities.count(),
      ]);

    return {
      numberOfmagicItems,
      numberOfPng,
      numberOfSpells,
      numberOfDeities,
    };
  } catch (error) {
    throw new DatabaseError("fetching dashboard counts", error);
  }
}
