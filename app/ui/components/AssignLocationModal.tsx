"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import Modal from "@/app/ui/components/Modal";
import FormErrorSummary from "@/app/ui/components/FormErrorSummary";
import Select from "@/app/ui/forms/inputs/Select";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import fetchZones from "@/app/lib/data/maps/fetchZones";
import fetchZoneLandmarks from "@/app/lib/data/maps/fetchZoneLandmarks";
import type AssignLocationInput from "@/app/lib/definitions/interfaces/maps/AssignLocationInput";
import fieldError from "@/app/lib/data/validation/fieldError";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import type ZoneOption from "@/app/lib/definitions/interfaces/maps/ZoneOption";
import type { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import type { PickerPlace } from "@/app/lib/definitions/interfaces/maps/PickerPlace";
import CreatePlaceForm from "@/app/ui/geography/CreatePlaceForm";

const NO_LANDMARK = 0;
const NO_ZONE = 0;

/**
 * The "none" entry is what makes TD-93's refusal recoverable from this
 * surface: with the invariant in place an entity has to be removed from
 * where it is before it can be assigned elsewhere, and until now this modal
 * could only ever set a zone, never clear one — the removal existed on the
 * map's place popover alone (SPEC-016 T4).
 */
function toZoneOptions(
  zones: ZoneOption[],
  noneLabel: string
): ResolvedOption[] {
  return [
    { value: NO_ZONE, label: noneLabel },
    ...zones.map((zone) => ({ value: zone.id, label: zone.title })),
  ];
}

function toLandmarkOptions(
  landmarks: ZoneOption[],
  noneLabel: string
): ResolvedOption[] {
  return [
    { value: NO_LANDMARK, label: noneLabel },
    ...landmarks.map((landmark) => ({
      value: landmark.id,
      label: landmark.title,
    })),
  ];
}

interface AssignLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: number;
  currentZoneId: number | null;
  currentPoiId: number | null;
  currentLocationLabel: string;
  assignAction: (input: AssignLocationInput) => Promise<MutationResult>;
  onAssigned?: () => void;
}

type AssignLocationModalBodyProps = Omit<AssignLocationModalProps, "isOpen">;

/**
 * The picker itself, mounted only while the modal is open (see the default
 * export below) — mounting fresh on every open is how the entity's current
 * assignment and a stale Zone/POI list get reset, with no effect-driven
 * `setState` needed for it.
 */
function AssignLocationModalBody({
  onClose,
  entityId,
  currentZoneId,
  currentPoiId,
  currentLocationLabel,
  assignAction,
  onAssigned,
}: AssignLocationModalBodyProps) {
  const t = useTranslations("common.locationModal");
  const tForm = useTranslations("common.form");

  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [landmarks, setLandmarks] = useState<ZoneOption[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(currentZoneId);
  const [poiId, setPoiId] = useState<number | null>(currentPoiId);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  // SPEC-026 — the place the DM meant may not exist yet.
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);

  useEffect(() => {
    fetchZones()
      .then(setZones)
      .catch(() => {
        setErrors({ zoneId: [fieldError("noZonesAvailable")] });
      });
    // Loads once per mount (i.e. once per time the modal opens) — no
    // dependency on anything that changes while it stays open.
  }, []);

  // Re-scope the POI options to whichever Zone is currently selected —
  // changing the Zone always clears a POI that no longer belongs to it.
  useEffect(() => {
    // A null zoneId hides the POI select entirely (below), so a stale
    // `landmarks` value in that state is never rendered — nothing to reset.
    if (zoneId === null) return;
    fetchZoneLandmarks(zoneId)
      .then(setLandmarks)
      .catch(() => setLandmarks([]));
  }, [zoneId]);

  const handleZoneChange = (value: number) => {
    setZoneId(value === NO_ZONE ? null : value);
    setPoiId(null);
  };

  const handlePoiChange = (value: number) => {
    setPoiId(value === NO_LANDMARK ? null : value);
  };

  // SPEC-026 §5.3 — the new place is the one selected. A landmark is
  // selected as the landmark of its parent zone, so that zone's list is
  // re-read even when it was already the selection; a zone joins the zone
  // list, which is re-read, and becomes the selection itself.
  const handlePlaceCreated = (place: PickerPlace) => {
    setIsCreatingPlace(false);
    if (place.kind === "poi") {
      setZoneId(place.parentId);
      setPoiId(place.id);
      fetchZoneLandmarks(place.parentId)
        .then(setLandmarks)
        .catch(() => setLandmarks([]));
      return;
    }
    fetchZones()
      .then(setZones)
      .catch(() => {
        setErrors({ zoneId: [fieldError("noZonesAvailable")] });
      });
    setZoneId(place.id);
    setPoiId(null);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const result = await assignAction({ id: entityId, zoneId, poiId });
    setIsSaving(false);

    if (!result.ok) {
      // TD-93's refusal arrives like any other: as a catalogue key
      // (`alreadyAtLocation`) that `FormErrorSummary` translates. Before
      // TD-124 the data layer wrote English prose here, so this branch
      // swapped in a catalogue message by `result.code`; it no longer has to.
      setErrors(result.errors);
      return;
    }

    setErrors({});
    onAssigned?.();
    onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {t("currentLabel", { location: currentLocationLabel })}
      </p>
      <FormErrorSummary errors={errors} />
      <Select
        label={t("zoneLabel")}
        value={zoneId ?? NO_ZONE}
        onChange={(value) => handleZoneChange(Number(value))}
        options={toZoneOptions(zones, t("zoneNoneOption"))}
      />
      {zoneId !== null && (
        <Select
          label={t("poiLabel")}
          value={poiId ?? NO_LANDMARK}
          onChange={(value) => handlePoiChange(Number(value))}
          options={toLandmarkOptions(landmarks, t("poiNoneOption"))}
        />
      )}
      {/* SPEC-026: create the place instead of leaving to find it. Inline
          rather than a second modal over this one, so the selection above
          stays in view and focus never leaves the dialog the DM is in.
          The parent defaults to the zone selected here — the entity's
          current place, or the place whose popover opened this (§5.2). */}
      {isCreatingPlace ? (
        <CreatePlaceForm
          zones={zones}
          defaultParentId={zoneId}
          onCreated={handlePlaceCreated}
          onCancel={() => setIsCreatingPlace(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsCreatingPlace(true)}
          className="text-sm text-blue-600 underline"
        >
          {t("createPlace")}
        </button>
      )}
      {!isCreatingPlace && (
        <div className="flex justify-end gap-2">
          <BaseButton onClick={() => void handleSubmit()} disabled={isSaving}>
            {isSaving ? tForm("saving") : tForm("save")}
          </BaseButton>
          <BaseButton onClick={onClose} variant={ButtonVariant.secondary}>
            {tForm("cancel")}
          </BaseButton>
        </div>
      )}
    </div>
  );
}

/**
 * The two-step location picker (SPEC-008 §5/T4): a required Zone, then an
 * optional landmark POI scoped to it. New surface with no precedent to
 * extend — `MapPOIPanel.tsx` creates places, this attaches an existing
 * entity to one that already exists.
 *
 * Shared between NPC and deity admin lists (and, per T5, the map itself):
 * the caller supplies which `assignLocation` mutation to call rather than
 * this component knowing about either domain.
 */
export default function AssignLocationModal({
  isOpen,
  ...bodyProps
}: AssignLocationModalProps) {
  const t = useTranslations("common.locationModal");

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={(next) => {
        if (!next) bodyProps.onClose();
      }}
      title={t("title")}
      size="small"
    >
      {isOpen && <AssignLocationModalBody {...bodyProps} />}
    </Modal>
  );
}
