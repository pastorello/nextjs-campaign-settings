"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { buildRootPlaceSchema } from "../validation/rootPlaceSchema";
import type {
  CreateRootPlaceInput,
  CreateRootPlaceResult,
} from "../../definitions/interfaces/maps/RootPlace";

/**
 * Creates the tree's root (SPEC-004 §10 M4) — name the world, give it a map
 * already uploaded via `POST /api/maps/upload` (M1). Refuses a second root:
 * the whole tree hangs off this one row, so a DM who somehow reached the
 * create-world form twice must not silently fork their world.
 */
export default async function createRootPlace(
  formData: CreateRootPlaceInput
): Promise<CreateRootPlaceResult> {
  await requireSession();

  const parsed = buildRootPlaceSchema().safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  let existingRoot;
  try {
    existingRoot = await prisma.poi.findFirst({
      where: { kind: "region", parentId: null },
      select: { id: true },
    });
  } catch (error) {
    throw toDatabaseError("checking for an existing root place", error);
  }

  if (existingRoot) {
    return {
      ok: false,
      errors: { title: ["A world has already been created."] },
    };
  }

  try {
    await prisma.poi.create({
      data: {
        title: parsed.data.title,
        mapImage: parsed.data.mapImage,
        kind: "region",
      },
    });
  } catch (error) {
    throw toDatabaseError("creating the root place", error);
  }

  revalidatePath("/dashboard/world");
  return { ok: true };
}
