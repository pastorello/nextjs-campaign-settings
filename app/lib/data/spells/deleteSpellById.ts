import prisma from "../../connections/prisma";

export async function deleteSpellById(id: number): Promise<boolean> {
  try {
    const existingItem = await prisma.spells.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return false;
    }

    await prisma.spells.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error("Errore durante la cancellazione:", error);
    return false;
  }
}
