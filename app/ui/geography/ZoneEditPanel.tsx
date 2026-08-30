"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import updateZoneDetails from "@/app/lib/data/maps/updateZoneDetails";
import zoneMeta from "@/app/lib/config/geography/zoneMeta";
import ZoneMetaField from "@/app/lib/definitions/enums/geography/ZoneMetaField";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import TextareaInput from "@/app/ui/forms/inputs/TextareaInput";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

interface ZoneEditPanelProps {
  placeId: number;
  /**
   * Externally controlled, like `MapGridConfigPanel`: the trigger is the
   * "Modifica" entry in `PlacePopover`, this component renders the form
   * inside a `Modal` that opens on demand.
   */
  isOpen: boolean;
  onClose: () => void;
  /** The stored values, as the popover last saw them. */
  title: string;
  description: string | null;
  /**
   * Whether this place is an *area* — a rectangle cast on its parent's map
   * (SPEC-009) — rather than a point. Only an area has a footprint to
   * redraw, so the area control is inert for a point-placed place.
   */
  hasFootprint: boolean;
  onSaved: (title: string, description: string | null) => void;
  /**
   * Hands the redraw gesture back to `WorldMap`, which arms `editingArea`
   * (SPEC-009 T5). It cannot happen in here: the redraw is a drag on the
   * Leaflet map, and this panel has no map reference — nor could it, with a
   * modal over the thing being dragged.
   *
   * Carries the just-saved name because `editingArea` keeps one for its
   * failure toast, and by this point the stored title may be one the DM
   * typed a moment ago — naming the place by its old name in an error
   * about the new one is exactly the kind of small lie that wastes a
   * debugging session.
   */
  onRedrawArea: (title: string) => void;
}

/**
 * A place's edit panel (TD-104): its name, its description, and its area,
 * in one surface. A bespoke map control outside the metadata layer
 * (ADR-0011) that consumes `zoneMeta`'s validators and label keys rather
 * than restating them — validation runs server-side in `updateZoneDetails`,
 * which builds its schema from those same validators, and field errors come
 * back through `BespokeFormErrorSummary` keyed by the same meta.
 *
 * One entry, not two, decided by the DM on 2026-08-30: before this, the
 * name and description had no edit surface anywhere in the application, and
 * the area's was stranded in the map's right-click menu where the DM did
 * not find it.
 *
 * **Redrawing saves first.** The area half is a drag on the map, so it
 * needs this modal gone — and a panel that vanished and discarded whatever
 * the DM had just typed into the two boxes above would be a trap. So the
 * button commits the text, and only re-arms the gesture once that has
 * succeeded. A failed save leaves the panel open with its errors showing
 * and the map untouched.
 */
export default function ZoneEditPanel({
  placeId,
  isOpen,
  onClose,
  title,
  description,
  hasFootprint,
  onSaved,
  onRedrawArea,
}: ZoneEditPanelProps) {
  const t = useTranslations();
  const tPanel = useTranslations("geography.zoneEdit");

  const [name, setName] = useState(title);
  const [notes, setNotes] = useState(description ?? "");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  // Re-seed the fields from the stored values each time the panel opens —
  // the "adjusting state during render" pattern `MapGridConfigPanel` and
  // `WorldMap` already use, for the same reason (a `setState` inside an
  // effect body trips `react-hooks/set-state-in-effect`).
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setName(title);
      setNotes(description ?? "");
      setErrors({});
    }
  }

  /**
   * The one write both buttons go through. Returns whether it committed, so
   * the redraw path can decline to disarm the panel over a failed save.
   * `null` rather than `""` for an emptied box — `zoneMeta.description`
   * refuses the empty string precisely so the column ends up with a single
   * representation of "no description".
   */
  async function save(): Promise<boolean> {
    const trimmedNotes = notes.trim();
    const nextDescription = trimmedNotes === "" ? null : trimmedNotes;
    setIsSaving(true);

    try {
      const result = await updateZoneDetails({
        id: placeId,
        title: name.trim(),
        description: nextDescription,
      });

      if (!result.ok) {
        setErrors(result.errors);
        return false;
      }

      setErrors({});
      notifySuccess(tPanel("success"));
      onSaved(name.trim(), nextDescription);
      return true;
    } catch (error) {
      console.error("Failed to save the place's details:", error);
      notifyError(tPanel("errors.saveFailed"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await save()) onClose();
  }

  async function handleRedraw() {
    const saved = name.trim();
    if (!(await save())) return;
    onClose();
    onRedrawArea(saved);
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
        <BespokeFormErrorSummary errors={errors} meta={zoneMeta} />
        <TextInput
          label={t(zoneMeta[ZoneMetaField.title].labelKey ?? "")}
          value={name}
          onChange={(value) => setName(String(value))}
        />
        <TextareaInput
          label={t(zoneMeta[ZoneMetaField.description].labelKey ?? "")}
          value={notes}
          onChange={(value) => setNotes(String(value))}
        />

        {/* The area half. Redrawing is the only edit it offers — SPEC-009
            T5 replaces the rectangle wholesale, and moving it elsewhere on
            the parent's map is the same gesture. A point-placed place has
            no rectangle at all: drawing a first one would convert it into
            an area, which is a different operation nobody has specified,
            so the control is disabled and says why rather than silently
            absent. Same shape as the popover's "Apri mappa". */}
        <div className="flex flex-col gap-1 border-t border-gray-200 pt-3 dark:border-gray-700">
          <span className="text-sm font-bold uppercase text-gray-700 dark:text-gray-200">
            {tPanel("area.label")}
          </span>
          <div>
            <BaseButton
              onClick={() => void handleRedraw()}
              variant={ButtonVariant.secondary}
              buttonState={
                !hasFootprint || isSaving
                  ? ButtonState.Disabled
                  : ButtonState.Default
              }
            >
              {tPanel("area.redraw")}
            </BaseButton>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {hasFootprint ? tPanel("area.redrawHint") : tPanel("area.noArea")}
          </p>
        </div>

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
