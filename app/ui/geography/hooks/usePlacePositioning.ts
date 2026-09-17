"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useUnplacedPlaces } from "@/app/modules/maps/hooks/useUnplacedPlaces";
import type UnplacedPlace from "@/app/lib/definitions/interfaces/maps/UnplacedPlace";
import type { UnplacedPickerRow } from "@/app/modules/maps/components/map/MapContextMenu";
import placeLandmark from "@/app/lib/data/maps/placeLandmark";
import placeZone from "@/app/lib/data/maps/placeZone";

/**
 * A pooled place's identity across both tables. `zone` and `poi` ids come
 * from independent sequences (TD-102), so the campaign-wide pool can hold
 * two rows numbered alike and an id alone cannot say which one was picked.
 */
function unplacedPlaceKey(place: UnplacedPlace): string {
  return `${place.kind === "poi" ? "poi" : "zone"}:${place.id}`;
}

/**
 * Positioning an unplaced place from the context menu's "Posiziona luogo"
 * entry (TD-85, SPEC-017 T8/T9) — extracted from `WorldMap` (TD-127).
 *
 * Owns the campaign-wide pool (`useUnplacedPlaces`), the picker rows it
 * offers on this map, and the placement itself. `refetchToken` is
 * `WorldMap`'s places token; `onPlacesChanged` bumps it after a successful
 * placement. `reloadPOIs` is `usePOIManager`'s, for a placed landmark.
 */
export function usePlacePositioning({
  parentId,
  ancestorIds,
  refetchToken,
  onPlacesChanged,
  reloadPOIs,
}: {
  parentId: number;
  ancestorIds: number[];
  refetchToken: number;
  onPlacesChanged: () => void;
  reloadPOIs: () => Promise<void>;
}): {
  picker: {
    here: UnplacedPickerRow[];
    elsewhere: UnplacedPickerRow[];
    byKey: Map<string, UnplacedPlace>;
  };
  positionPlace: (key: string, lat: number, lng: number) => Promise<void>;
} {
  const t = useTranslations("geography.errors");
  const tContextMenu = useTranslations("geography.contextMenu");

  // The campaign's unplaced places — one pool, every map (SPEC-017 T8),
  // where this used to be the children of the map in view. Feeds
  // `MapContextMenu`'s "Posiziona luogo" dropdown (TD-85). It used to feed
  // `MapPOIPanel`'s "Unplaced places" picker as well; that was the DM's
  // second method for the same job and is withdrawn (SPEC-016 T9,
  // SPEC-005 §3).
  const unplacedPlaces = useUnplacedPlaces(refetchToken, parentId);

  // What may be placed *here*, split the way the picker shows it (T9):
  // this map's own unplaced children first, then the rest of the campaign,
  // each of those naming where it currently lives — so that picking it, an
  // act that moves it here, says so before the click rather than after.
  //
  // A place that contains this map would break the tree, and `placeZone`
  // refuses it (T5), so it is left out rather than offered and rejected.
  // The `kind` guard is not decoration: `zone` and `poi` ids come from
  // independent sequences (TD-102), so a landmark that happens to share a
  // number with an ancestor zone would otherwise vanish for no reason at
  // all. A landmark has no children and can never be an ancestor.
  const picker = useMemo(() => {
    const here: UnplacedPickerRow[] = [];
    const elsewhere: UnplacedPickerRow[] = [];
    const byKey = new Map<string, UnplacedPlace>();

    for (const place of unplacedPlaces) {
      if (place.kind !== "poi" && ancestorIds.includes(place.id)) continue;

      const key = unplacedPlaceKey(place);
      byKey.set(key, place);
      if (place.parentId === parentId) {
        here.push({ key, title: place.title });
      } else {
        elsewhere.push({
          key,
          title: place.title,
          sublabel: tContextMenu("positionPlace.fromParent", {
            parent: place.parentTitle,
          }),
        });
      }
    }

    return { here, elsewhere, byKey };
  }, [unplacedPlaces, ancestorIds, parentId, tContextMenu]);

  // Positions an unplaced place directly at the point the context menu was
  // opened over (TD-85) — the right-click itself is the aim, so picking a
  // place from "Posiziona luogo"'s dropdown finalizes the position right
  // away rather than re-arming a second crosshair click the way the
  // withdrawn panel picker did (SPEC-016 T9). `MapContextMenu`
  // withholds this entry over an existing area with the same `hideAddPlace`
  // gate it already applies to "Add Place" (SPEC-009 T4), so this handler
  // never needs its own containment check.
  const positionPlace = useCallback(
    async (key: string, lat: number, lng: number) => {
      const child = picker.byKey.get(key);
      const title = child?.title ?? "";

      // TD-102 — an id on its own does not say which table to write to.
      // The pool merges `zone` and `poi` rows and the two id sequences are
      // independent, so the picker hands back `${table}:${id}` rather than
      // a bare number: with a campaign-wide pool (T8) two rows numbered
      // alike are no longer a coincidence to shrug at. Refuse rather than
      // default to a table: defaulting is what moved a place the DM never
      // chose.
      if (!child) {
        console.error("No unplaced place matches the chosen key:", key);
        toast.error(t("placePositionFailed", { title }));
        return;
      }

      const isLandmark = child.kind === "poi";
      // Picking from the second group re-parents (T4/T6). Worth saying out
      // loud afterwards: the write is silent, and "posizionato" would not
      // tell the DM their place had also changed map.
      const isMove = child.parentId !== parentId;

      try {
        // `kind === "poi"` is a sound discriminator, not a convention:
        // `fetchPlaceChildren` hardcodes it for every `poi` row,
        // `placeSchema` restricts `zone.kind` to the navigable kinds, and
        // SPEC-008 T8's migration copied only navigable-kind rows into
        // `zone`. No zone can carry it.
        const result = isLandmark
          ? await placeLandmark({ id: child.id, zoneId: parentId, lat, lng })
          : await placeZone({ id: child.id, parentId, lat, lng });
        if (result.ok) {
          onPlacesChanged();
          // A landmark that gains coordinates has to be *loaded*, not just
          // dropped from the unplaced list: `usePOIManager` owns the
          // landmark markers and holds its own state, and this write
          // happened outside its optimistic path — the row is not in `pois`
          // yet, so `updatePOI` would have nothing to find. `reloadPOIs`
          // exists for exactly this and had been left with no caller:
          // SPEC-016 T9 withdrew `MapPOIPanel`'s unplaced picker, which was
          // the one that used to call it. Without this the placement
          // persists and the marker appears only on the next reload
          // (TD-102).
          if (isLandmark) await reloadPOIs();
          toast.success(
            isMove
              ? tContextMenu("positionPlace.movedToast", {
                  title,
                  from: child.parentTitle,
                })
              : tContextMenu("positionPlace.placedToast", { title })
          );
        } else {
          // TD-93 — a refused second placement is not a failed one: the
          // write was rejected on purpose, and the DM needs to be told what
          // to do about it rather than invited to "try again". The landmark
          // wording stops short of naming a recovery: SPEC-016 T5's "Sposta
          // nei luoghi non posizionati" exists for navigable places only,
          // so telling a DM to un-place a landmark first would point at a
          // control that is not there (TD-102).
          // `wouldCycle` (T5) has no recovery to offer, unlike
          // `alreadyPlaced`: the destination is wrong, not the state of the
          // thing being placed, so the message says what is wrong and stops
          // there. "Try again" would be a lie — the same pick would be
          // refused again, which is TD-93's reasoning one refusal over.
          toast.error(
            result.code === "alreadyPlaced"
              ? isLandmark
                ? t("landmarkAlreadyPositioned", { title })
                : t("placeAlreadyPositioned", { title })
              : result.code === "wouldCycle"
                ? t("placeContainsThisMap", { title })
                : t("placePositionFailed", { title })
          );
        }
      } catch (error) {
        console.error("Failed to position place from the context menu:", error);
        toast.error(t("placePositionFailed", { title }));
      }
    },
    // `parentId` is a dependency now that a placement writes it (SPEC-017
    // T4): `GeographyExplorer` does not key `WorldMap`, so descending swaps
    // the prop on a mounted component and a memoised handler holding the
    // old id would move the place onto the map the DM just left.
    [picker, parentId, reloadPOIs, onPlacesChanged, t, tContextMenu]
  );

  return { picker, positionPlace };
}
