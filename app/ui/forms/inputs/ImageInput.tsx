"use client";

import { DragEvent, useId, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import MetaValue from "@/app/lib/definitions/types/MetaValue";
import FieldErrorKey, {
  FIELD_ERROR_KEYS,
} from "@/app/lib/definitions/types/FieldErrorKey";
import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
} from "@/app/lib/storage/imageUploadRules";
import isValidString from "@/app/lib/utils/validators/isValidString";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

const UPLOAD_ROUTE = "/api/record-images";

/** The thumbnail of a stored record image, by its `recordImage` id. */
export function recordImageThumbUrl(imageId: number): string {
  return `${UPLOAD_ROUTE}/by-id/${imageId}?size=thumb`;
}

const knownErrorKeys: ReadonlySet<string> = new Set(FIELD_ERROR_KEYS);

/** The upload route's refusal, or `imageStoreFailed` for anything unreadable. */
async function refusalOf(response: Response): Promise<FieldErrorKey> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && knownErrorKeys.has(body.error)) {
      return body.error as FieldErrorKey;
    }
  } catch {
    // Not JSON — a proxy error page, say. Reported as a failed store.
  }
  return "imageStoreFailed";
}

interface ImageInputProps {
  /**
   * A `recordImage` id, or `null`/absent for none. `MetaValue` because the
   * control registry hands every control the same shape (TD-08 step 4); a
   * table-backed or image field's `null` reaches it all the same.
   */
  value: MetaValue | null;
  onChange: (value: MetaValue) => void;
  label?: string;
  id?: string;
}

/**
 * The image field (SPEC-020 T3, `ControlType.Image`): pick a file or drop
 * one, see its thumbnail, replace it, remove it.
 *
 * Uploading happens as soon as a file is chosen, through the authenticated
 * `POST /api/record-images` route — not the form's Server Action, whose body
 * is capped at 1 MB (ADR-0017). The route decodes, strips and resizes the
 * file, records a `recordImage` row and answers its id; this control then
 * sets that id as the field's value, and the form submits it with the rest
 * of the record. A refusal is shown under the control as a field error and
 * leaves the value untouched, so a failed replace keeps the previous image
 * (SPEC-020 §5).
 *
 * The type and size are checked here first only to spare a pointless 10 MB
 * upload; the server check is the rule.
 *
 * "Remove" sets the value to `null`; the save then detaches the image and
 * deletes it. Nothing is deleted until the record is saved, so cancelling
 * the form keeps the stored image as it was.
 */
export default function ImageInput({
  value,
  onChange,
  label,
  id,
}: ImageInputProps) {
  const t = useTranslations();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const fileInput = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<FieldErrorKey | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const imageId = typeof value === "number" && value > 0 ? value : null;

  async function upload(file: File) {
    if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(file.type)) {
      setError("imageUnsupportedType");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("imageTooLarge");
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch(UPLOAD_ROUTE, { method: "POST", body });
      if (!response.ok) {
        setError(await refusalOf(response));
        return;
      }
      const { id: uploadedId } = (await response.json()) as { id: number };
      onChange(uploadedId);
    } catch (uploadError) {
      console.error("Failed to upload an image:", uploadError);
      setError("imageStoreFailed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file && !isUploading) void upload(file);
  }

  const pick = () => fileInput.current?.click();
  const busy = isUploading ? ButtonState.Loading : ButtonState.Default;

  return (
    <div className="w-full">
      {isValidString(label) && (
        <label
          htmlFor={inputId}
          className="mb-[10px] block text-sm font-medium text-gray-900"
        >
          {label}
        </label>
      )}
      <div
        data-testid="image-drop-zone"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex items-center gap-3 rounded-md border border-dashed p-3 ${
          isDragOver ? "border-blue-600 bg-sky-50" : "border-gray-300"
        }`}
      >
        {imageId !== null && (
          <Image
            src={recordImageThumbUrl(imageId)}
            alt={t("common.fields.image.previewAlt")}
            width={96}
            height={96}
            unoptimized
            className="h-24 w-24 shrink-0 rounded-md object-cover"
          />
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInput}
            id={inputId}
            type="file"
            accept={ALLOWED_IMAGE_CONTENT_TYPES.join(",")}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Cleared so choosing the same file again still fires.
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
          <div className="flex gap-2">
            {imageId === null ? (
              <BaseButton
                onClick={pick}
                variant={ButtonVariant.secondary}
                buttonState={busy}
              >
                {t("common.fields.image.upload")}
              </BaseButton>
            ) : (
              <>
                <BaseButton
                  onClick={pick}
                  variant={ButtonVariant.secondary}
                  buttonState={busy}
                >
                  {t("common.fields.image.replace")}
                </BaseButton>
                <BaseButton
                  onClick={() => {
                    setError(null);
                    onChange(null as unknown as MetaValue);
                  }}
                  variant={ButtonVariant.secondary}
                  buttonState={
                    isUploading ? ButtonState.Disabled : ButtonState.Default
                  }
                >
                  {t("common.fields.image.remove")}
                </BaseButton>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {isUploading
              ? t("common.fields.image.uploading")
              : t("common.fields.image.dropHint")}
          </p>
          {error !== null && (
            <p role="alert" className="text-sm text-red-600">
              {t(`common.fieldErrors.${error}`)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
