"use server";

import requireDm from "@/app/lib/auth/requireDm";
import prisma from "@/app/lib/connections/prisma";
import {
  placeRefSchema,
  type PlaceRefInput,
} from "@/app/lib/data/validation/placeRevealSchema";
import type PlaceReveals from "@/app/lib/definitions/interfaces/maps/PlaceReveals";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import fetchPlaceTree from "./fetchPlaceTree";
import { hidingAncestor } from "./placeTree";

/**
 * A place's reveals for the map's reveal dialog (SPEC-022 T6b): every
 * campaign, whether the place is revealed to it, and which ancestor, if
 * any, still hides it there. Places are the shared world, so every system's
 * campaigns are listed. Null when the place does not exist.
 */
export default async function fetchPlaceReveals(
  input: PlaceRefInput
): Promise<PlaceReveals | null> {
  await requireDm();
  const { kind, id } = placeRefSchema.parse(input);

  let campaigns;
  try {
    campaigns = await prisma.campaign.findMany({
      select: { id: true, title: true },
      orderBy: [{ title: "asc" }, { id: "asc" }],
    });
  } catch (error) {
    throw toDatabaseError("listing the campaigns to reveal to", error);
  }
  const tree = await fetchPlaceTree();
  const place = kind === "zone" ? tree.zones.get(id) : tree.pois.get(id);
  if (!place) return null;

  return {
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      revealed: place.revealedTo.has(campaign.id),
      hiddenBy: hidingAncestor(tree, kind, id, campaign.id),
    })),
  };
}
