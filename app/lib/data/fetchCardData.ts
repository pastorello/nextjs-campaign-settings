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
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}
