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
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import type ZoneOption from "@/app/lib/definitions/interfaces/maps/ZoneOption";
import type { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";

const NO_LANDMARK = 0;

function toZoneOptions(zones: ZoneOption[]): ResolvedOption[] {
  return zones.map((zone) => ({ value: zone.id, label: zone.title }));
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
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  useEffect(() => {
    fetchZones()
      .then(setZones)
      .catch(() => {
        setErrors({ zoneId: [t("noZonesAvailable")] });
      });
    // Loads once per mount (i.e. once per time the modal opens) — no
    // dependency on anything that changes while it stays open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setZoneId(value);
    setPoiId(null);
  };

  const handlePoiChange = (value: number) => {
    setPoiId(value === NO_LANDMARK ? null : value);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const result = await assignAction({ id: entityId, zoneId, poiId });
    setIsSaving(false);

    if (!result.ok) {
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
        value={zoneId ?? ""}
        onChange={(value) => handleZoneChange(Number(value))}
        options={toZoneOptions(zones)}
      />
      {zoneId !== null && (
        <Select
          label={t("poiLabel")}
          value={poiId ?? NO_LANDMARK}
          onChange={(value) => handlePoiChange(Number(value))}
          options={toLandmarkOptions(landmarks, t("poiNoneOption"))}
        />
      )}
      <div className="flex justify-end gap-2">
        <BaseButton onClick={() => void handleSubmit()} disabled={isSaving}>
          {isSaving ? tForm("saving") : tForm("save")}
        </BaseButton>
        <BaseButton onClick={onClose} variant={ButtonVariant.secondary}>
          {tForm("cancel")}
        </BaseButton>
      </div>
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
