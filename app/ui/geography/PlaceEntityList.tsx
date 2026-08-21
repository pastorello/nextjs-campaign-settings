"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import fetchEntitiesAtPlace from "@/app/lib/data/maps/fetchEntitiesAtPlace";
import assignNpcLocation from "@/app/lib/data/npc/assignLocation";
import assignDeityLocation from "@/app/lib/data/deities/assignLocation";
import { notifyError } from "@/app/lib/notifications/notify";
import type EntityAtPlace from "@/app/lib/definitions/interfaces/maps/EntityAtPlace";
import type AssignLocationInput from "@/app/lib/definitions/interfaces/maps/AssignLocationInput";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

/**
 * Which place's attachments to list — a zone's direct ones, or a
 * landmark's. The same discriminant `fetchEntitiesAtPlace` takes (T1).
 */
export type EntityListTarget = { zoneId: number } | { poiId: number };

/**
 * Detaching is SPEC-008's existing mutation called with both slots
 * cleared, not a new one (§6) — the same table split `AttachEntityButton`
 * already maps over for the assigning direction.
 */
const ASSIGN_ACTIONS: Record<
  LinkableEntityType,
  (input: AssignLocationInput) => Promise<MutationResult>
> = {
  npc: assignNpcLocation,
  deity: assignDeityLocation,
};

interface PlaceEntityListProps {
  target: EntityListTarget;
}

const rowKey = (entity: EntityAtPlace) => `${entity.type}-${entity.id}`;

/**
 * The entities present at a place, inside its popover (SPEC-016 T3, §5) —
 * each with an X that detaches it back to the unattached pool.
 *
 * Its own component rather than inline markup in `PlacePopover`, because
 * the landmark popover (T7) needs the identical list against a `poiId`
 * target: the zone/landmark difference is entirely in the discriminant
 * passed here, and both branches are covered by this file's tests.
 *
 * Detaching clears **both** `zoneId` and `poiId` even when the list was
 * opened from a landmark (§5 edge cases) — "no longer at this landmark"
 * means back to the unattached pool, not demoted to the enclosing zone.
 *
 * The list updates from local state after a successful detach rather than
 * refetching (§8: "the popover updates without reopening") — the server
 * has just told us the one row's outcome, and a second round-trip would
 * only re-derive it.
 */
export default function PlaceEntityList({ target }: PlaceEntityListProps) {
  const t = useTranslations("geography.popover");
  const [entities, setEntities] = useState<EntityAtPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detachingKey, setDetachingKey] = useState<string | null>(null);

  // Depended on as primitives, not as `target` itself: the caller builds
  // that object inline, so a fresh identity on every parent render would
  // re-run this effect forever.
  const zoneId = "zoneId" in target ? target.zoneId : null;
  const poiId = "poiId" in target ? target.poiId : null;

  useEffect(() => {
    let cancelled = false;

    // The `setState` calls live inside an async function invoked from the
    // effect rather than in its body, the shape `AttachEntityButton` and
    // `DeletePlaceButton` both use — a synchronous `setState` at the top of
    // an effect body trips `react-hooks/set-state-in-effect`.
    const loadEntities = async () => {
      setIsLoading(true);
      try {
        const result = await fetchEntitiesAtPlace(
          poiId === null ? { zoneId: zoneId as number } : { poiId }
        );
        if (!cancelled) setEntities(result);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load the entities at the place:", error);
        notifyError(t("errors.loadEntitiesFailed"));
        setEntities([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadEntities();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `t` intentionally excluded: a new translator identity from a parent re-render must not refetch the list.
  }, [zoneId, poiId]);

  const handleDetach = async (entity: EntityAtPlace) => {
    setDetachingKey(rowKey(entity));
    try {
      const result = await ASSIGN_ACTIONS[entity.type]({
        id: entity.id,
        zoneId: null,
        poiId: null,
      });
      if (!result.ok) {
        notifyError(t("errors.detachFailed"));
        return;
      }
      setEntities((current) =>
        current.filter((candidate) => rowKey(candidate) !== rowKey(entity))
      );
    } catch (error) {
      console.error("Failed to detach the entity from the place:", error);
      notifyError(t("errors.detachFailed"));
    } finally {
      setDetachingKey(null);
    }
  };

  return (
    <section className="mb-3">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t("entities")}
      </h4>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("entitiesLoading")}
        </p>
      ) : entities.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("entitiesEmpty")}
        </p>
      ) : (
        // Scrolls within the popover so the actions below stay visible
        // however long the list gets (§5 edge cases).
        <ul className="max-h-32 overflow-y-auto">
          {entities.map((entity) => (
            <li
              key={rowKey(entity)}
              className="flex items-center justify-between gap-2 py-0.5"
            >
              <span className="truncate text-sm text-gray-700 dark:text-gray-200">
                {entity.name}
              </span>
              <button
                type="button"
                disabled={detachingKey === rowKey(entity)}
                onClick={() => void handleDetach(entity)}
                aria-label={t("detach", { name: entity.name })}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
