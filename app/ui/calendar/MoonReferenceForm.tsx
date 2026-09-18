"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import calendarSettingsMeta from "@/app/lib/config/calendar/calendarSettingsMeta";
import setMoonReferenceDay from "@/app/lib/data/calendar/setMoonReferenceDay";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import WorldDateValue from "@/app/lib/definitions/interfaces/calendar/WorldDateValue";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import WorldDateInput from "./WorldDateInput";

interface MoonReferenceFormProps {
  systems: readonly DateSystem[];
  /** The saved reference new moon, a universal day; `null` when unset. */
  moonNewMoonDay: number | null;
  /** The system the viewer reads dates in — the input opens in it. */
  displaySystemId: number;
}

/**
 * The moon's reference new moon (SPEC-014 §5.3): one universal day, entered
 * through `WorldDateInput` like every other date, from which every phase is
 * counted. "Clear" sets it back to `null` — no phase shown anywhere. The
 * input's hour is ignored: a phase belongs to a whole day.
 */
export default function MoonReferenceForm({
  systems,
  moonNewMoonDay,
  displaySystemId,
}: MoonReferenceFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { errors, isSaving, submit } = useMutationSubmit();
  const [value, setValue] = useState<WorldDateValue>({
    universalDay: moonNewMoonDay,
    hour: null,
  });

  async function save(day: number | null) {
    const saved = await submit(() =>
      setMoonReferenceDay({ moonNewMoonDay: day })
    );
    if (saved) router.refresh();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // An empty or impossible date is `null` here; sent as-is it would clear
    // the reference, so the input's own error stands instead.
    if (value.universalDay === null) return;
    void save(value.universalDay);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <BespokeFormErrorSummary errors={errors} meta={calendarSettingsMeta} />
      <WorldDateInput
        legend={t(calendarSettingsMeta.moonNewMoonDay.labelKey)}
        systems={systems}
        value={value}
        onChange={setValue}
        initialSystemId={displaySystemId}
      />
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={
            isSaving
              ? ButtonState.Loading
              : value.universalDay === null
                ? ButtonState.Disabled
                : ButtonState.Default
          }
        >
          {t("common.form.save")}
        </BaseButton>
        {moonNewMoonDay !== null && (
          <BaseButton
            onClick={() => void save(null)}
            variant={ButtonVariant.secondary}
            buttonState={isSaving ? ButtonState.Disabled : ButtonState.Default}
          >
            {t("calendar.moon.clearButton")}
          </BaseButton>
        )}
      </div>
    </form>
  );
}
