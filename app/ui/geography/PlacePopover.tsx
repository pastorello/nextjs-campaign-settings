"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { useLeafletMap } from "@/app/modules/maps/hooks/useLeafletMap";
import PlaceEntityList, {
  type EntityListTarget,
} from "@/app/ui/geography/PlaceEntityList";
import AttachEntityButton from "@/app/ui/geography/AttachEntityButton";
import RemovePlaceDialog from "@/app/ui/geography/RemovePlaceDialog";
import RemoveLandmarkDialog from "@/app/ui/geography/RemoveLandmarkDialog";
import type { NavigableChild } from "@/app/modules/maps/hooks/useNavigableChildren";
import type { POI } from "@/app/modules/maps/types/poi";
import type { FocusReturnTarget } from "@/app/modules/maps/lib/utils/keyboardActivation";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import { recordImageByIdUrl } from "@/app/lib/utils/images/recordImageUrls";
import ClientResolvedRecordLinks from "@/app/ui/richText/ClientResolvedRecordLinks";

/**
 * What the popover is anchored to (T7) — a navigable zone (marker or drawn
 * area, `useNavigableChildren`) or a landmark POI (`usePOIManager`). Each
 * carries its click source's own shape rather than a normalised common one:
 * the two overlap (id/title/description/lat/lng) but aren't identical — a
 * zone has a `mapImage` to open and a position to clear, a landmark has
 * neither (§5's landmark flow) — and forcing a shared shape would either
 * lose those fields or fake them.
 */
export type PopoverTarget =
  | { kind: "zone"; place: NavigableChild }
  /**
   * `poiId` is the landmark's database id, resolved by `usePOIManager` and
   * carried here rather than derived from `poi.id` (TD-108). `POI.id` is a
   * client key the hook deliberately never swaps for the real one, so on a
   * landmark created in this session it is `poi-<timestamp>-<random>` and
   * `Number()` on it is `NaN` — which Prisma serialises to `null`, turning
   * the entity query into `WHERE "poiId" IS NULL` and listing every
   * unattached NPC and deity as present here. Carrying the resolved id
   * makes that state unrepresentable at this boundary instead of relying on
   * each consumer to convert correctly.
   */
  | { kind: "poi"; poi: POI; poiId: number };

interface PlacePopoverProps {
  target: PopoverTarget;
  /**
   * Set when the popover was opened from the keyboard (TD-133): the marker
   * or area that was activated. Focus then moves to the popover's first
   * action, and returns here on close. `null`/absent for a click.
   */
  returnFocusTo?: FocusReturnTarget | null;
  /**
   * The place currently being viewed — this popover's target's own parent.
   * Named in the zone deletion dialog's reparent message (T6); pre-fills
   * the attach control's Zone step for a landmark (T7), whose own `POI`
   * shape carries no `zoneId` of its own (`usePOIManager` scopes POIs to
   * this id instead).
   */
  parentId: number;
  parentTitle: string;
  onClose: () => void;
  onOpenMap: (place: NavigableChild) => void;
  /**
   * "Rimuovi dalla mappa" — the answer SPEC-023's dialog gives back when
   * the DM picks the outcome that destroys nothing (T5's un-place, reached
   * through the one question rather than through an entry of its own since
   * 2026-09-24). The mutation and its refetch/count bookkeeping are
   * `WorldMap`'s, the same split as `onOpenMap`. Zone only — a landmark's
   * own un-place is `onUnplaceLandmark` below.
   */
  onUnplace: (place: NavigableChild) => void;
  /**
   * "Elimina definitivamente" (T6) succeeded — `WorldMap` closes the
   * popover and drops its marker, the same bookkeeping `onUnplace` does,
   * since the place this popover is anchored to no longer exists. Zone
   * only — a landmark's own deletion is `onDeleteLandmark` below.
   */
  onDeleted: () => void;
  /**
   * "Modifica" (TD-104) — opens `ZoneEditPanel` for this place: its name,
   * its description and its area in one surface. One entry rather than a
   * "Modifica area" moved across plus a rename bolted on later, decided by
   * the DM on 2026-08-30. Delegates entirely, like `onEditLandmark` below
   * and for the same reason: the panel is a single instance `WorldMap`
   * owns, and the area half needs the map this popover sits on top of.
   */
  onEditZone: (place: NavigableChild) => void;
  /**
   * "Modifica" (T7) — opens `MapPOIPanel`'s existing edit form for this
   * landmark, pre-filled (TD-85's remainder, finally reachable). The panel
   * is a single shared instance owned by `WorldMap`, not something this
   * popover can mount a second copy of the way T6 embeds `RemovePlaceDialog`
   * — so unlike deletion, this delegates entirely rather than embedding
   * anything.
   */
  onEditLandmark: (poi: POI) => void;
  /**
   * "Rimuovi dalla mappa" for a landmark (SPEC-017 T10) — the same act as
   * `onUnplace` above, on the other table, and since SPEC-023 reached
   * through the same one question. Separate rather than widened because
   * the two mutations are separate: a landmark's position lives in `poi`,
   * and its marker is `usePOIManager`'s to drop, not
   * `placesRefetchToken`'s.
   */
  onUnplaceLandmark: (poi: POI) => void;
  /**
   * "Elimina definitivamente" for a landmark — `usePOIManager.deletePOI`.
   * §5's "deleting and re-creating a landmark is cheap" was the reasoning
   * for shipping this unconfirmed; the DM decided otherwise (TD-140,
   * 2026-09-18), and SPEC-023 then folded that confirmation into
   * `RemoveLandmarkDialog`'s one question. `WorldMap` still owns the
   * mutation, so this delegates as before — only the asking moved.
   */
  onDeleteLandmark: (poi: POI) => void;
}

/**
 * The place popover (SPEC-016) — anchored to the marker or rectangle the DM
 * clicked, replacing the old click-to-descend behaviour
 * (`useNavigableChildren`, T2). This shell carries the title, description
 * and "Apri mappa", plus the entities present at the place (T3), the attach
 * control (T4), un-placing (T5) and deletion (T6) for a zone; T7 adds the
 * landmark variant on top — same shell, `target.kind` swaps which action
 * buttons render and which discriminant `PlaceEntityList`/`AttachEntityButton`
 * are given.
 *
 * Tracks the map's own `move`/`zoom` events to stay anchored to the clicked
 * place's `lat`/`lng` while the DM pans, rather than closing on any map
 * movement the way `MapContextMenu` does — a popover the DM is reading is
 * worth keeping open through a small pan, unlike a menu whose position only
 * ever mattered for the single click that opened it.
 *
 * "Collega personaggio" (T4) reuses `AttachEntityButton` as-is, pre-filled
 * with the clicked zone rather than the map's own currently-viewed parent.
 * Since T8 removed the right-click menu's own entry (TD-96), this is the
 * map's only way in. A successful attach bumps `refreshKey` rather than
 * threading the new entity through state: the list has just been told to
 * refetch, and `AssignLocationModal` already knows nothing about what it
 * assigned beyond an id. For a landmark (T7), the same control also pre-fills
 * `poiId` — `AttachEntityButton`'s own extension, not a second mechanism.
 *
 * **"Rimuovi" is one entry, not two** (SPEC-023, 2026-09-24). T5's
 * "Sposta nei luoghi non posizionati" and T6's "Elimina definitivamente"
 * used to sit next to each other, and telling them apart was the DM's
 * problem before clicking. They are now the two named outcomes of a single
 * dialog — `RemovePlaceDialog` for a zone, `RemoveLandmarkDialog` for a
 * landmark — which states what each one costs before either is taken.
 *
 * For a zone that dialog is embedded directly: the same component
 * `MapOptionsButton` already opens for the place currently being viewed,
 * unforked, retargeted at the clicked place and handed an `onUnplace` that
 * surface has nothing to pass. The impact counts and the SPEC-010 mutation
 * are entirely its own; only the outcomes' bookkeeping — closing the
 * popover, dropping the marker — bubbles up, through `onUnplace` and
 * `onDeleted` respectively, since either way the place this popover is
 * anchored to stops being on this map.
 *
 * "Modifica"/"Rimuovi" (T7) both delegate to `WorldMap` instead — the panel
 * they reach (`MapPOIPanel`) and the mutation they call (`usePOIManager`'s
 * `updatePOI`/`deletePOI`) are both singletons WorldMap already owns, so
 * there is nothing for this popover to embed, only a target to hand back.
 */
export default function PlacePopover({
  target,
  returnFocusTo = null,
  parentId,
  parentTitle,
  onClose,
  onOpenMap,
  onUnplace,
  onDeleted,
  onEditZone,
  onEditLandmark,
  onUnplaceLandmark,
  onDeleteLandmark,
}: PlacePopoverProps) {
  const map = useLeafletMap();
  const t = useTranslations("geography.popover");
  const popoverRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [isRemoveLandmarkOpen, setIsRemoveLandmarkOpen] = useState(false);
  const [entitiesRefreshKey, setEntitiesRefreshKey] = useState(0);
  const [screenPosition, setScreenPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Narrowed once, reused by every kind-specific button block below —
  // `null` is the "not this kind" branch, so `place &&`/`poi &&` in JSX
  // reads the same way `hasMap`'s own guard always has.
  const place = target.kind === "zone" ? target.place : null;
  const poi = target.kind === "poi" ? target.poi : null;

  const title = target.kind === "zone" ? target.place.title : target.poi.title;
  const description =
    target.kind === "zone"
      ? target.place.description
      : (target.poi.description ?? null);
  const lat = target.kind === "zone" ? target.place.lat : target.poi.lat;
  const lng = target.kind === "zone" ? target.place.lng : target.poi.lng;

  useEffect(() => {
    if (!map) return;

    const updatePosition = () => {
      const point = map.latLngToContainerPoint([lat, lng]);
      setScreenPosition({ x: point.x, y: point.y });
    };

    updatePosition();
    map.on("move", updatePosition);
    map.on("zoom", updatePosition);
    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [map, lat, lng]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // `AttachEntityButton`'s modal (T4) is Headless UI, which portals its
      // content to a root at `document.body` — outside `popoverRef` in the
      // DOM regardless of where the component sits in the React tree — so
      // a click inside it would otherwise read as "outside" and close the
      // popover out from under the modal it just opened.
      const insidePortal =
        target instanceof Element &&
        target.closest("[data-headlessui-portal]") !== null;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !insidePortal
      ) {
        onClose();
      }
    };
    // Delayed the same way `MapContextMenu` delays its own listener — the
    // Leaflet marker/rectangle click that opened this popover would
    // otherwise bubble into this same handler and close it instantly.
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // TD-133 — a keyboard-opened popover takes focus (its first action, not
  // the close button) and, on close, gives it back to the marker — unless
  // focus has already moved somewhere else on purpose, e.g. into the panel
  // "Modifica" opened. A click-opened one leaves focus alone.
  const isPositioned = screenPosition !== null;
  useEffect(() => {
    if (!returnFocusTo || !isPositioned) return;

    const actions = actionsRef.current;
    actions
      ?.querySelector<HTMLButtonElement>("button:not([disabled])")
      ?.focus();

    const popover = popoverRef.current;
    return () => {
      const active = document.activeElement;
      const focusWasLost =
        active === null ||
        active === document.body ||
        (popover?.contains(active) ?? false);
      if (focusWasLost && returnFocusTo.isConnected) {
        returnFocusTo.focus({ preventScroll: true });
      }
    };
  }, [returnFocusTo, isPositioned]);

  if (!screenPosition) return null;

  const hasMap = place !== null && place.mapImage !== null;

  const entityListTarget: EntityListTarget =
    target.kind === "zone"
      ? { zoneId: target.place.id }
      : { poiId: target.poiId };

  const attachPoiId = target.kind === "poi" ? target.poiId : null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-[1100] w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      style={{ left: screenPosition.x, top: screenPosition.y }}
      role="dialog"
      aria-label={title}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* The place's picture (SPEC-020 T4), by id: a popover shows one
          place, so the route's row lookup is one request, not one per row,
          and the map's place reads stay free of image keys. A fixed box,
          the image contained in it, so the popover never jumps when the
          bytes land. `unoptimized` — see `RecordThumbnail`. Landmarks carry
          no picture. */}
      {place?.imageId != null && (
        <Image
          src={recordImageByIdUrl(place.imageId, "display")}
          alt={title}
          width={264}
          height={160}
          unoptimized
          className="mb-2 h-40 w-full rounded-lg bg-gray-100 object-contain"
        />
      )}

      {description && (
        // Formatted text (SPEC-019 T5); loaded client-side with the map, so
        // its record links resolve through a Server Action.
        <ClientResolvedRecordLinks values={[description]}>
          <div className="mb-3 text-sm text-gray-600">
            {renderRichText(description)}
          </div>
        </ClientResolvedRecordLinks>
      )}

      {/* Keyed by `zoneId` for a zone, `poiId` for a landmark — the only
          difference the T3 list itself takes as a discriminant. */}
      <PlaceEntityList
        target={entityListTarget}
        refreshKey={entitiesRefreshKey}
      />

      <div ref={actionsRef} className="mb-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setIsAttachOpen(true)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {t("attach")}
        </button>

        {place && (
          <>
            {/* "Modifica" (TD-104) — `WorldMap` opens `ZoneEditPanel` for
                this place. First in the fragment, ahead of the two entries
                that take something away. Shown for every zone, not only an
                area: the name and description are the half that had no edit
                surface anywhere in the application, and a point-placed
                place has those too. */}
            <button
              type="button"
              onClick={() => onEditZone(place)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t("editZone")}
            </button>
            {/* "Rimuovi" (SPEC-023) — one entry where T5's un-place and
                T6's delete used to be two, opening the dialog that asks
                which of the two is meant. Styled as an ordinary entry
                rather than a red one: the destructive outcome is one of
                two answers inside, not what this button does. */}
            <button
              type="button"
              onClick={() => setIsRemoveOpen(true)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t("remove")}
            </button>
          </>
        )}

        {poi && (
          <>
            {/* "Modifica" (T7) — `WorldMap` opens `MapPOIPanel` in edit
                mode, pre-filled with this landmark. */}
            <button
              type="button"
              onClick={() => onEditLandmark(poi)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t("editLandmark")}
            </button>
            {/* "Rimuovi" (SPEC-023) — the landmark's own single entry,
                same shape and same position as the zone's. Behind it,
                SPEC-017 T10's un-place and T7's delete are the two named
                outcomes of `RemoveLandmarkDialog`; TD-140's standalone
                confirmation is folded into it. Both mutations stay
                `usePOIManager`'s, reached through `WorldMap`. */}
            <button
              type="button"
              onClick={() => setIsRemoveLandmarkOpen(true)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {t("remove")}
            </button>
          </>
        )}
      </div>

      {place && (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={!hasMap}
            onClick={() => hasMap && onOpenMap(place)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            {t("openMap")}
          </button>
          {!hasMap && (
            <p className="text-xs text-gray-500">{t("openMapUnavailable")}</p>
          )}
        </div>
      )}

      {/* Pre-filled with the clicked zone (or, for a landmark, its
          enclosing zone plus the landmark itself) rather than the map's
          currently-viewed parent (contrast `WorldMap`'s own mount of this
          component) — the popover's whole point is acting on the place
          under the click. */}
      <AttachEntityButton
        zoneId={place ? place.id : parentId}
        poiId={attachPoiId}
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        onAttached={() => setEntitiesRefreshKey((key) => key + 1)}
      />

      {/* "Rimuovi" (SPEC-023) — the same `RemovePlaceDialog`
          `MapOptionsButton` opens for the place currently being viewed,
          here targeting the clicked place and given the second outcome
          that surface has no way to offer. Never rendered for the root,
          since the root never gets a popover in the first place (§5's edge
          cases) — `isRoot={false}` is therefore always correct here. Zone
          only. */}
      {place && (
        <RemovePlaceDialog
          placeId={place.id}
          placeTitle={place.title}
          parentTitle={parentTitle}
          isRoot={false}
          isOpen={isRemoveOpen}
          onClose={() => setIsRemoveOpen(false)}
          onUnplace={() => onUnplace(place)}
          onDeleted={onDeleted}
        />
      )}

      {/* The landmark's own one question (SPEC-023) — same two outcomes as
          the zone's, minus the impact fetch: a landmark is a leaf, nothing
          reparents when it goes. Landmark only. */}
      {poi && (
        <RemoveLandmarkDialog
          landmarkTitle={poi.title}
          isOpen={isRemoveLandmarkOpen}
          onClose={() => setIsRemoveLandmarkOpen(false)}
          onUnplace={() => onUnplaceLandmark(poi)}
          onDelete={() => onDeleteLandmark(poi)}
        />
      )}
    </div>
  );
}
