"use client";

import { useTranslations } from "next-intl";

import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

/** An inline row form's save and cancel buttons (SPEC-028). */
export default function InlineRowFormButtons({
  submitLabel,
  isSaving,
  onCancel,
}: {
  submitLabel: string;
  isSaving: boolean;
  onCancel: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex justify-end gap-2">
      <BaseButton
        buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
      >
        {submitLabel}
      </BaseButton>
      <BaseButton
        onClick={onCancel}
        variant={ButtonVariant.secondary}
        buttonState={isSaving ? ButtonState.Disabled : ButtonState.Default}
      >
        {t("common.form.cancel")}
      </BaseButton>
    </div>
  );
}
