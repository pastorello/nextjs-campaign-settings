import prisma from "../../connections/prisma";

export async function deleteDeityById(id: number): Promise<boolean> {
  try {
    const existingItem = await prisma.deities.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return false;
    }

    await prisma.deities.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error("Errore durante la cancellazione:", error);
    return false;
  }
}
