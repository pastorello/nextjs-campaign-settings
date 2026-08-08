"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
  onAttached,
}: AttachEntityButtonProps) {
  const t = useTranslations("geography.attachEntity");
  const tForm = useTranslations("common.form");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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
    setIsPickerOpen(false);
    setEntityType(null);
    setOptions([]);
    setSelected(null);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <button
        onClick={() => setIsPickerOpen(true)}
        className="rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {t("trigger")}
      </button>

      {isPickerOpen && selected === null && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg bg-white dark:bg-gray-800 p-3 shadow-md w-64">
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
      )}

      {selected !== null && entityType !== null && (
        <AssignLocationModal
          isOpen
          onClose={reset}
          entityId={selected.id}
          currentZoneId={zoneId}
          currentPoiId={null}
          currentLocationLabel={selected.name}
          assignAction={ASSIGN_ACTIONS[entityType]}
          onAssigned={() => {
            onAttached?.();
            reset();
          }}
        />
      )}
    </div>
  );
}
