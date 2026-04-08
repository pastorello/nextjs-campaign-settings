import prisma from "../../connections/prisma";

export async function deletePngById(id: number): Promise<boolean> {
  try {
    const existingItem = await prisma.png.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return false;
    }

    await prisma.png.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error("Errore durante la cancellazione:", error);
    return false;
  }
}
