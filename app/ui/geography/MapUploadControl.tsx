"use client";

import { useState } from "react";
import { Field, Input } from "@headlessui/react";
import { useTranslations } from "next-intl";

import { ALLOWED_MAP_IMAGE_CONTENT_TYPES } from "@/app/lib/storage/mapImageUploadRules";
import updateZoneMap from "@/app/lib/data/maps/updateZoneMap";
import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import Modal from "@/app/ui/components/Modal";
import FormLabel from "@/app/ui/forms/inputs/FormLabel";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

interface MapUploadControlProps {
  placeId: number;
  /** Whether the place currently being viewed already has a map. */
  hasMap: boolean;
  /**
   * Externally controlled (usability fix, 2026-08-17): this used to render
   * as an always-open inline form in its own map corner; the trigger now
   * lives in `MapOptionsButton`'s menu, and this component renders the
   * form inside a `Modal` that opens on demand instead.
   */
  isOpen: boolean;
  onClose: () => void;
  onMapChanged: (mapImage: string) => void;
}

/**
 * Gives the place currently being viewed a map, or replaces the one it has
 * (SPEC-007 T1) — reachable via `MapOptionsButton`'s menu, since a mapless
 * place is otherwise only reachable by clicking through to it (SPEC-007's
 * grey/"❔" marker in `useNavigableChildren`).
 *
 * Replacing an existing map goes through a confirmation first: children keep
 * their `lat`/`lng`, but those are stored against the map's bounds, not the
 * image, so a differently-framed replacement silently moves every child
 * relative to the terrain (SPEC-007 §5, §9 risks).
 */
export default function MapUploadControl({
  placeId,
  hasMap,
  isOpen,
  onClose,
  onMapChanged,
}: MapUploadControlProps) {
  const t = useTranslations("geography.mapUpload");
  const [file, setFile] = useState<File | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setFile(null);
    setIsConfirmOpen(false);
    onClose();
  };

  const submit = async () => {
    if (!file) return;
    setIsSubmitting(true);

    try {
      const uploadBody = new FormData();
      uploadBody.set("file", file);
      const uploadResponse = await fetch("/api/maps/upload", {
        method: "POST",
        body: uploadBody,
      });
      if (!uploadResponse.ok) {
        notifyError(t("errors.uploadFailed"));
        return;
      }
      const { id: mapImage } = (await uploadResponse.json()) as {
        id: string;
      };

      const result = await updateZoneMap({ id: placeId, mapImage });
      if (!result.ok) {
        notifyError(t("errors.saveFailed"));
        return;
      }

      notifySuccess(t("success"));
      onMapChanged(mapImage);
      reset();
    } catch (error) {
      console.error("Failed to upload the place's map:", error);
      notifyError(t("errors.uploadFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (!file) return;
    if (hasMap) {
      setIsConfirmOpen(true);
      return;
    }
    void submit();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        setIsOpen={(open) => {
          if (!open) reset();
        }}
        // No `title` here on purpose: `FormLabel` below already gives the
        // file input its own accessible name via `Field`/`Label`
        // association. A Modal title would duplicate it — Headless UI's
        // `Dialog` sets `aria-labelledby` on itself from the title, and an
        // identical accessible name on two elements (the dialog and the
        // input) makes `getByLabelText`-style lookups ambiguous.
        title=""
        size="small"
      >
        <div className="flex flex-col gap-2">
          <Field>
            <FormLabel label={hasMap ? t("replaceLabel") : t("uploadLabel")} />
            <Input
              type="file"
              accept={ALLOWED_MAP_IMAGE_CONTENT_TYPES.join(",")}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-900 dark:text-white"
            />
          </Field>
          <BaseButton
            onClick={handleSubmitClick}
            buttonState={
              isSubmitting ? ButtonState.Loading : ButtonState.Default
            }
            variant={hasMap ? ButtonVariant.secondary : ButtonVariant.primary}
          >
            {hasMap ? t("replaceSubmit") : t("uploadSubmit")}
          </BaseButton>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmOpen}
        setIsOpen={setIsConfirmOpen}
        title={t("confirmReplaceTitle")}
        description={t("confirmReplaceDescription")}
        size="small"
      >
        <div className="flex justify-end gap-2">
          <BaseButton
            variant={ButtonVariant.neutral}
            onClick={() => setIsConfirmOpen(false)}
          >
            {t("confirmReplaceCancel")}
          </BaseButton>
          <BaseButton
            variant={ButtonVariant.danger}
            buttonState={
              isSubmitting ? ButtonState.Loading : ButtonState.Default
            }
            onClick={() => {
              setIsConfirmOpen(false);
              void submit();
            }}
          >
            {t("confirmReplaceConfirm")}
          </BaseButton>
        </div>
      </Modal>
    </>
  );
}
