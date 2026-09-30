"use client";

import { useTranslations } from "next-intl";

import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";

/**
 * The bar over the map while an area's outline is being edited (SPEC-024
 * T5): what can be done, and the two ways out. Enter and Escape do the same
 * from the keyboard, but a gesture with no visible end is one the DM has to
 * remember — so the bar says it, names the area, and offers both buttons.
 */
export default function OutlineEditBar({
  title,
  onSave,
  onCancel,
}: {
  title: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("geography.outlineEdit");

  return (
    <div
      role="region"
      aria-label={title}
      className="absolute left-1/2 top-3 z-[1000] flex max-w-[90%] -translate-x-1/2 flex-col gap-2 rounded-lg bg-white/95 p-3 text-sm text-gray-800 shadow-lg md:flex-row md:items-center"
    >
      <p>
        <span className="font-semibold">{title}</span> — {t("hint")}
      </p>
      <div className="flex shrink-0 gap-2">
        <BaseButton variant={ButtonVariant.neutral} onClick={onCancel}>
          {t("cancel")}
        </BaseButton>
        <BaseButton onClick={onSave}>{t("save")}</BaseButton>
      </div>
    </div>
  );
}
