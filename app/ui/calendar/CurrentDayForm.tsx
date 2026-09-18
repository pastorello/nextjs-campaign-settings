"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import campaignCalendarMeta from "@/app/lib/config/calendar/campaignCalendarMeta";
import setCampaignCurrentDay from "@/app/lib/data/calendar/setCampaignCurrentDay";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import WorldDateValue from "@/app/lib/definitions/interfaces/calendar/WorldDateValue";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";
import WorldDate from "./WorldDate";
import WorldDateInput from "./WorldDateInput";

interface CurrentDayFormProps {
  campaignId: number;
  systems: readonly DateSystem[];
  /** The saved current day, a universal day; `null` when unset. */
  currentDay: number | null;
  /** The system the viewer reads dates in — shown in, and the input opens in. */
  displaySystem: DateSystem;
}

/**
 * The campaign's "today" (SPEC-014 §5.5, T6): shown in the displayed
 * system, set through `WorldDateInput` like every other date, advanced one
 * day at a time — the DM moves it by hand as play goes on — or cleared,
 * after which nothing reads as past. The input's hour is ignored: today is
 * a whole day.
 */
export default function CurrentDayForm({
  campaignId,
  systems,
  currentDay,
  displaySystem,
}: CurrentDayFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { errors, isSaving, submit } = useMutationSubmit();
  const [value, setValue] = useState<WorldDateValue>({
    universalDay: currentDay,
    hour: null,
  });
  // Remounts the input on a save, so it shows the saved day rather than the
  // draft it read once when it first rendered.
  const [inputKey, setInputKey] = useState(0);

  async function save(day: number | null) {
    const saved = await submit(() =>
      setCampaignCurrentDay(campaignId, { currentDay: day })
    );
    if (!saved) return;
    setValue({ universalDay: day, hour: null });
    setInputKey((key) => key + 1);
    router.refresh();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // An empty or impossible date is `null` here; sent as-is it would clear
    // today, so the input's own error stands instead.
    if (value.universalDay === null) return;
    void save(value.universalDay);
  }

  const idle = isSaving ? ButtonState.Disabled : ButtonState.Default;

  return (
    <section
      className="mt-4 rounded-md border border-gray-200 p-3"
      data-testid="current-day"
    >
      <p className="mb-2 text-sm" data-testid="current-day-value">
        {currentDay === null ? (
          t("calendar.campaign.today.unset")
        ) : (
          <>
            <span className="font-medium">
              {t(campaignCalendarMeta.currentDay.labelKey)}:
            </span>{" "}
            <WorldDate universalDay={currentDay} system={displaySystem} />
          </>
        )}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <BespokeFormErrorSummary errors={errors} meta={campaignCalendarMeta} />
        <WorldDateInput
          key={inputKey}
          legend={t(campaignCalendarMeta.currentDay.labelKey)}
          systems={systems}
          value={value}
          onChange={setValue}
          initialSystemId={displaySystem.id}
        />
        <div className="flex flex-wrap justify-end gap-2">
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
          {currentDay !== null && (
            <>
              <BaseButton
                onClick={() => void save(currentDay + 1)}
                variant={ButtonVariant.secondary}
                buttonState={idle}
              >
                {t("calendar.campaign.today.advanceButton")}
              </BaseButton>
              <BaseButton
                onClick={() => void save(null)}
                variant={ButtonVariant.secondary}
                buttonState={idle}
              >
                {t("calendar.campaign.today.clearButton")}
              </BaseButton>
            </>
          )}
        </div>
      </form>
    </section>
  );
}
