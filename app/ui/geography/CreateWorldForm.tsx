"use client";

import { FormEvent, useState } from "react";
import { Field, Input } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import createRootPlace from "@/app/lib/data/maps/createRootPlace";
import { ALLOWED_MAP_IMAGE_CONTENT_TYPES } from "@/app/lib/storage/mapImageUploadRules";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import FormLabel from "@/app/ui/forms/inputs/FormLabel";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

/**
 * "Name your world and upload its map" — the one action an empty
 * installation offers (SPEC-004 §5.1/§10 M4). Uploads the file through M1's
 * `POST /api/maps/upload` first, then hands the returned id to
 * `createRootPlace`; `world/page.tsx` refetches on `router.refresh()` and
 * renders the "already exists" state once the root is created.
 */
export default function CreateWorldForm() {
  const t = useTranslations("world");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fieldError, setFieldError] = useState<"title" | "map" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim().length === 0) {
      setFieldError("title");
      return;
    }
    if (!file) {
      setFieldError("map");
      return;
    }
    setFieldError(null);
    setSubmitting(true);

    try {
      const uploadBody = new FormData();
      uploadBody.set("file", file);
      const uploadResponse = await fetch("/api/maps/upload", {
        method: "POST",
        body: uploadBody,
      });
      if (!uploadResponse.ok) {
        toast.error(t("errors.uploadFailed"));
        return;
      }
      const { id: mapImage } = (await uploadResponse.json()) as {
        id: string;
      };

      const result = await createRootPlace({ title, mapImage });
      if (!result.ok) {
        toast.error(t("errors.createFailed"));
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to create the world:", error);
      toast.error(t("errors.createFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="max-w-sm">
      <div className="mb-4">
        <TextInput
          label={t("form.nameLabel")}
          value={title}
          onChange={(value) => setTitle(String(value))}
          placeholder={t("form.namePlaceholder")}
        />
        {fieldError === "title" && (
          <p className="mt-1 text-sm text-red-600">
            {t("errors.nameRequired")}
          </p>
        )}
      </div>

      <div className="mb-4">
        <Field>
          <FormLabel label={t("form.mapLabel")} />
          <Input
            type="file"
            accept={ALLOWED_MAP_IMAGE_CONTENT_TYPES.join(",")}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </Field>
        {fieldError === "map" && (
          <p className="mt-1 text-sm text-red-600">{t("errors.mapRequired")}</p>
        )}
      </div>

      <BaseButton
        buttonState={submitting ? ButtonState.Loading : ButtonState.Default}
      >
        {t("form.submit")}
      </BaseButton>
    </form>
  );
}
