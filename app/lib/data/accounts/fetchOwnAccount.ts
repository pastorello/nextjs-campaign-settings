import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** The signed-in DM's own name and email, for the account page (SPEC-022 T2). */
export default async function fetchOwnAccount(): Promise<{
  name: string;
  email: string;
} | null> {
  const session = await requireDm();
  try {
    return await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });
  } catch (error) {
    throw toDatabaseError("reading the signed-in account", error);
  }
}
