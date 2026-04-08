import prisma from "../../connections/prisma";

export async function deleteMagicItemById(id: number): Promise<boolean> {
  try {
    const existingItem = await prisma.magicitems.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return false;
    }

    await prisma.magicitems.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error("Errore durante la cancellazione:", error);
    return false;
  }
}
