import prisma from "../../connections/prisma";
import toDatabaseError from "../../errors/toDatabaseError";
import NotFoundError from "../../errors/NotFoundError";

/**
 * Deletes one Daggerheart domain card, or throws. Nothing references a card
 * (characters are a later spec, SPEC-021 §3), so there is no check first.
 */
export async function deleteDhDomainCardById(id: number): Promise<void> {
  let existingCard;
  try {
    existingCard = await prisma.dhDomainCard.findUnique({ where: { id } });
  } catch (error) {
    throw toDatabaseError("looking up domain card for deletion", error);
  }

  if (!existingCard) {
    throw new NotFoundError("Domain card", id);
  }

  try {
    await prisma.dhDomainCard.delete({ where: { id } });
  } catch (error) {
    throw toDatabaseError("deleting domain card", error);
  }
}
