"use client";

import { FormEvent, useState } from "react";
import { Field, Select } from "@headlessui/react";
import { useTranslations } from "next-intl";

import updateZoneGrid from "@/app/lib/data/maps/updateZoneGrid";
import zoneGridMeta from "@/app/lib/config/geography/zoneGridMeta";
import gridScales from "@/app/lib/config/geography/grid-scales";
import type GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import ZoneGridMetaField from "@/app/lib/definitions/enums/geography/ZoneGridMetaField";
import { deriveGridRows } from "@/app/modules/maps/lib/utils/grid";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import FormLabel from "@/app/ui/forms/inputs/FormLabel";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

interface MapGridConfigPanelProps {
  placeId: number;
  /**
   * Externally controlled, like `MapUploadControl`: the trigger lives in
   * `MapOptionsButton`'s menu, this component renders the form inside a
   * `Modal` that opens on demand.
   */
  isOpen: boolean;
  onClose: () => void;
  /** The stored configuration, both null until the DM sets one (§6). */
  gridColumns: number | null;
  gridScale: string | null;
  /**
   * The map image's natural pixel size, or `null` while it is not known
   * (still loading, or undecodable) — the derived height renders as `—`
   * then, never `0` (§5's edge-case table).
   */
  imageSize: { width: number; height: number } | null;
  onSaved: (gridColumns: number, gridScale: GridScale) => void;
}

/** Narrows the stored raw string through the meta's own validator. */
function toInitialScale(gridScale: string | null): GridScale {
  const parsed =
    zoneGridMeta[ZoneGridMetaField.gridScale].validator.safeParse(gridScale);
  return parsed.success
    ? parsed.data
    : zoneGridMeta[ZoneGridMetaField.gridScale].defaultValue;
}

/**
 * The grid configuration panel behind the map's edit control (SPEC-015 T5,
 * §5 steps 1–4): the width in squares and one of the four scales. A bespoke
 * map control outside the metadata layer (ADR-0011) that consumes
 * `zoneGridMeta`'s validators and label keys rather than restating them —
 * validation runs server-side in `updateZoneGrid`, which builds its schema
 * from those same validators, and field errors come back through
 * `BespokeFormErrorSummary` keyed by the same meta.
 *
 * The height in squares is derived, never asked (§5 step 3): shown
 * read-only from `deriveGridRows` so the DM can sanity-check the width
 * against the image's aspect ratio before saving.
 *
 * A native `<select>` rather than the generic `Select` control, on purpose:
 * the four scales are a semantic ladder (dungeon → continent, §6's own
 * order) and the generic control alphabetizes its options via
 * `sortSelectOptions`; native semantics also keep the panel
 * keyboard-completable for free (§8).
 */
export default function MapGridConfigPanel({
  placeId,
  isOpen,
  onClose,
  gridColumns,
  gridScale,
  imageSize,
  onSaved,
}: MapGridConfigPanelProps) {
  const t = useTranslations();
  const tPanel = useTranslations("geography.gridConfig");

  const [columns, setColumns] = useState(
    gridColumns === null ? "" : String(gridColumns)
  );
  const [scale, setScale] = useState<GridScale>(toInitialScale(gridScale));
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  // Re-seed the fields from the stored values each time the panel opens —
  // the "adjusting state during render" pattern `WorldMap` already uses,
  // for the same reason (a `setState` inside an effect body trips
  // `react-hooks/set-state-in-effect`).
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setColumns(gridColumns === null ? "" : String(gridColumns));
      setScale(toInitialScale(gridScale));
      setErrors({});
    }
  }

  const columnsNumber = Number(columns);
  const derivedRows =
    imageSize === null
      ? null
      : deriveGridRows(
          Number.isFinite(columnsNumber) && columnsNumber > 0
            ? columnsNumber
            : null,
          imageSize.width,
          imageSize.height
        );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateZoneGrid({
        id: placeId,
        gridColumns: columnsNumber,
        gridScale: scale,
      });

      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      setErrors({});
      notifySuccess(tPanel("success"));
      onSaved(columnsNumber, scale);
      onClose();
    } catch (error) {
      console.error("Failed to save the map's grid:", error);
      notifyError(tPanel("errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={(open) => {
        if (!open) onClose();
      }}
      title={tPanel("title")}
      size="small"
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        <BespokeFormErrorSummary errors={errors} meta={zoneGridMeta} />
        <TextInput
          label={t(zoneGridMeta[ZoneGridMetaField.gridColumns].labelKey ?? "")}
          value={columns}
          onChange={(value) => setColumns(String(value))}
        />
        <Field className="w-full">
          <FormLabel
            label={t(zoneGridMeta[ZoneGridMetaField.gridScale].labelKey ?? "")}
          />
          <Select
            value={scale}
            onChange={(event) => setScale(toInitialScale(event.target.value))}
            className="flex h-[32px] w-full items-center rounded-md border bg-white px-[5px] dark:bg-slate-700 dark:text-white"
          >
            {gridScales.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </Field>
        <p className="text-sm text-gray-700 dark:text-gray-200">
          <span className="font-bold uppercase">
            {tPanel("derivedRows.label")}
          </span>{" "}
          <span data-testid="derived-rows">
            {derivedRows === null ? "—" : String(derivedRows)}
          </span>
        </p>
        <div className="flex justify-end gap-2">
          <BaseButton
            buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
          >
            {tPanel("save")}
          </BaseButton>
          <BaseButton
            onClick={onClose}
            variant={ButtonVariant.secondary}
            buttonState={isSaving ? ButtonState.Disabled : ButtonState.Default}
          >
            {t("common.form.cancel")}
          </BaseButton>
        </div>
      </form>
    </Modal>
  );
}
