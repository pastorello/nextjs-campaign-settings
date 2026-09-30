"use server";

import fieldError from "@/app/lib/data/validation/fieldError";
import toFieldErrors from "@/app/lib/data/validation/toFieldErrors";
import { revalidateDashboard } from "@/app/lib/utils/revalidateDashboard";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { POI_CATEGORIES } from "@/app/modules/maps/constants/poi-categories";
import {
  pickerPlaceSchema,
  type PickerPlaceInput,
} from "../validation/pickerPlaceSchema";
import type { PickerPlaceResult } from "../../definitions/interfaces/maps/PickerPlace";

/**
 * Creates a place from a place picker without leaving it (SPEC-026) — the
 * tavern the DM is writing an NPC into, before it exists anywhere.
 *
 * **Unplaced by design** (§5): no coordinates are written, so the place
 * lands in its parent's unplaced pool and is drawn whenever the DM next
 * places it (SPEC-017). No placement check runs, since there is no point or
 * area to check; `createPlace`/`createPoi` stay the map's own creators.
 *
 * A landmark takes the first category — the same default the map's panel
 * preselects — which the DM changes later from the panel; a zone's kind is
 * not editable afterwards, which is why the dialog asks for the type up
 * front (the DM's answer of 2026-09-30).
 */
export default async function createPlaceFromPicker(
  input: PickerPlaceInput
): Promise<PickerPlaceResult> {
  await requireSession();

  const parsed = pickerPlaceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: toFieldErrors(parsed.error) };
  }

  const { title, parentId, kind } = parsed.data;
  if (parentId === null) {
    return {
      ok: false,
      errors: { parentId: [fieldError("placeNeedsParent")] },
    };
  }

  let parent;
  try {
    parent = await prisma.zone.findUnique({
      where: { id: parentId },
      select: { id: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up the new place's parent", error);
  }
  if (!parent) {
    return { ok: false, errors: { parentId: [fieldError("placeNotFound")] } };
  }

  let id: number;
  try {
    if (kind === "poi") {
      const created = await prisma.poi.create({
        data: {
          title,
          zoneId: parentId,
          // TD-20b-style literal access: `POI_CATEGORIES` is a fixed,
          // non-empty list declared in code.
          category: POI_CATEGORIES[0]!.id,
          lat: null,
          lng: null,
        },
      });
      id = created.id;
    } else {
      const created = await prisma.zone.create({
        data: { title, kind, parentId, lat: null, lng: null },
      });
      id = created.id;
    }
  } catch (error) {
    throw toDatabaseError("creating a place from a picker", error);
  }

  revalidateDashboard("geography");
  return {
    ok: true,
    place: { kind: kind === "poi" ? "poi" : "zone", id, parentId },
  };
}
