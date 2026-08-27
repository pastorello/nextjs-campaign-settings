"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Modal from "@/app/ui/components/Modal";
import AssignLocationModal from "@/app/ui/components/AssignLocationModal";
import fetchLinkableEntities, {
  type LinkableEntityOption,
} from "@/app/lib/data/maps/fetchLinkableEntities";
import { LINKABLE_ENTITY_TYPES } from "@/app/modules/maps/constants/linkable-entities";
import assignNpcLocation from "@/app/lib/data/npc/assignLocation";
import assignDeityLocation from "@/app/lib/data/deities/assignLocation";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";
import type AssignLocationInput from "@/app/lib/definitions/interfaces/maps/AssignLocationInput";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";

const ASSIGN_ACTIONS: Record<
  LinkableEntityType,
  (input: AssignLocationInput) => Promise<MutationResult>
> = {
  npc: assignNpcLocation,
  deity: assignDeityLocation,
};

interface AttachEntityButtonProps {
  /** The zone currently being viewed — pre-fills the modal's Zone step. */
  zoneId: number;
  /**
   * Pre-fills the modal's optional landmark step too (T7's landmark
   * popover) — `null`/omitted for a zone popover, the clicked landmark's
   * id for a landmark one. `zoneId` still names its *enclosing* zone in
   * that case (`PlacePopover` passes its own `parentId`, since a `POI` has
   * no `zoneId` field of its own — `usePOIManager` scopes POIs to it
   * instead).
   */
  poiId?: number | null;
  /**
   * Externally controlled (usability fix, 2026-08-17): this used to be a
   * floating trigger button in its own map corner, then `MapContextMenu`'s
   * "Collega un personaggio esistente" entry, which SPEC-016 T8 removed
   * (TD-96). The only trigger left is `PlacePopover`'s "Collega
   * personaggio" (SPEC-016 T4) — this component renders only the
   * picker/modal flow itself, pre-filled to whichever zone (and, per T7,
   * landmark) its caller passes. `geography.attachEntity.trigger` outlived
   * the entry that shared it: it is this modal's own title.
   */
  isOpen: boolean;
  onClose: () => void;
  onAttached?: () => void;
}

/**
 * The map's own entry point into the assignment modal (SPEC-008 §5/T5) —
 * "pick an existing NPC/deity and attach it to the zone or landmark
 * currently in view." Unlike the admin list's per-row button, there is no
 * single entity in context yet, so this adds a first step (type, then
 * entity) before handing off to the same modal and the same mutation the
 * admin list uses.
 */
export default function AttachEntityButton({
  zoneId,
  poiId = null,
  isOpen,
  onClose,
  onAttached,
}: AttachEntityButtonProps) {
  const t = useTranslations("geography.attachEntity");
  const tForm = useTranslations("common.form");
  const [entityType, setEntityType] = useState<LinkableEntityType | null>(null);
  const [options, setOptions] = useState<LinkableEntityOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<LinkableEntityOption | null>(null);

  // `setState` calls live inside `loadOptions`, an async function invoked
  // from the effect rather than run directly in its body — same shape
  // `MapPOIPanel`'s own entity-type effect uses, since a synchronous
  // `setState` at the top of an effect body trips `react-hooks/set-state-in-effect`.
  useEffect(() => {
    if (entityType === null) return;

    const loadOptions = async () => {
      setIsLoading(true);
      try {
        setOptions(await fetchLinkableEntities(entityType));
      } finally {
        setIsLoading(false);
      }
    };

    void loadOptions();
  }, [entityType]);

  const reset = () => {
    setEntityType(null);
    setOptions([]);
    setSelected(null);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && selected === null}
        setIsOpen={(open) => {
          if (!open) reset();
        }}
        title={t("trigger")}
        size="small"
      >
        <div className="flex flex-col gap-2">
          <select
            value={entityType ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setEntityType(
                value === "" ? null : (value as LinkableEntityType)
              );
              setOptions([]);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">{t("typePlaceholder")}</option>
            {LINKABLE_ENTITY_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          {entityType !== null && (
            <select
              value=""
              disabled={isLoading}
              onChange={(e) => {
                const option = options.find(
                  (candidate) => String(candidate.id) === e.target.value
                );
                if (option) setSelected(option);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm disabled:opacity-50"
            >
              <option value="">
                {isLoading ? "…" : t("entityPlaceholder")}
              </option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={reset}
            className="self-end text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            {tForm("cancel")}
          </button>
        </div>
      </Modal>

      {selected !== null && entityType !== null && (
        <AssignLocationModal
          isOpen
          onClose={reset}
          entityId={selected.id}
          currentZoneId={zoneId}
          currentPoiId={poiId}
          currentLocationLabel={selected.name}
          assignAction={ASSIGN_ACTIONS[entityType]}
          onAssigned={() => {
            onAttached?.();
            reset();
          }}
        />
      )}
    </>
  );
}
