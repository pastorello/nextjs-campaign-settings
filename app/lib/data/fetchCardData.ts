import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "@/app/lib/connections/prisma";

export default async function fetchCardData() {
  try {
    const [numberOfmagicItems, numberOfNpc, numberOfSpells, numberOfDeities] =
      await prisma.$transaction([
        prisma.magicitems.count(),
        prisma.npc.count(),
        prisma.spells.count(),
        prisma.deities.count(),
      ]);

    return {
      numberOfmagicItems,
      numberOfNpc,
      numberOfSpells,
      numberOfDeities,
    };
  } catch (error) {
    throw toDatabaseError("fetching dashboard counts", error);
  }
}
