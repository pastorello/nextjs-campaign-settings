"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { adjacentMonth } from "@/app/lib/calendar/adjacentMonth";
import type CalendarMonth from "@/app/lib/calendar/CalendarMonth";
import { monthRange } from "@/app/lib/calendar/monthRange";
import { universalDayToDate } from "@/app/lib/calendar/universalDayToDate";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonSize from "@/app/ui/buttons/BaseButton/ButtonSize";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import useMonthGridHref from "./useMonthGridHref";
import WorldDateInput from "./WorldDateInput";

interface MonthGridNavigationProps {
  month: CalendarMonth;
  systems: readonly DateSystem[];
  displaySystem: DateSystem;
  /**
   * The campaign's current day, for "today" (SPEC-014 §5.6: jump-to-today
   * is a campaign's). Absent on world history, or with no day set.
   */
  today?: number | null | undefined;
}

/**
 * Moves the month grid (SPEC-014 §5.6, T7): the previous and next month,
 * a jump to any date through the same date input the forms use, and — on
 * a campaign with a current day — back to today. Every move is a URL
 * (`?view=grid&year=&month=`), so the month shown survives a reload and
 * can be linked; the list's page number is dropped, as it means nothing
 * to the grid.
 */
export default function MonthGridNavigation({
  month,
  systems,
  displaySystem,
  today = null,
}: MonthGridNavigationProps) {
  const t = useTranslations("calendar.grid");
  const router = useRouter();
  const hrefFor = useMonthGridHref();
  const { firstDay } = monthRange(month);

  const previous = adjacentMonth(month, -1);
  const next = adjacentMonth(month, 1);

  return (
    <div className="mt-4 flex flex-wrap items-end gap-4">
      <div className="flex gap-2">
        <BaseButton
          {...(previous && { to: hrefFor(previous) })}
          disabled={previous === null}
          size={ButtonSize.small}
          variant={ButtonVariant.secondary}
        >
          {t("previousMonth")}
        </BaseButton>
        <BaseButton
          {...(next && { to: hrefFor(next) })}
          disabled={next === null}
          size={ButtonSize.small}
          variant={ButtonVariant.secondary}
        >
          {t("nextMonth")}
        </BaseButton>
        {today !== null && (
          <BaseButton
            to={hrefFor(universalDayToDate(today))}
            size={ButtonSize.small}
            variant={ButtonVariant.secondary}
          >
            {t("today")}
          </BaseButton>
        )}
      </div>
      <JumpToDateForm
        // A new month starts the jump afresh at its first day.
        key={firstDay}
        firstDay={firstDay}
        systems={systems}
        displaySystem={displaySystem}
        onJump={(day) => router.push(hrefFor(universalDayToDate(day)))}
      />
    </div>
  );
}

interface JumpToDateFormProps {
  firstDay: number;
  systems: readonly DateSystem[];
  displaySystem: DateSystem;
  onJump: (universalDay: number) => void;
}

function JumpToDateForm({
  firstDay,
  systems,
  displaySystem,
  onJump,
}: JumpToDateFormProps) {
  const t = useTranslations("calendar.grid");
  const [jumpDay, setJumpDay] = useState<number | null>(firstDay);

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (jumpDay !== null) onJump(jumpDay);
      }}
    >
      <WorldDateInput
        legend={t("jumpLegend")}
        systems={systems}
        value={{ universalDay: firstDay, hour: null }}
        onChange={({ universalDay }) => setJumpDay(universalDay)}
        initialSystemId={displaySystem.id}
      />
      <BaseButton
        type="submit"
        disabled={jumpDay === null}
        size={ButtonSize.small}
      >
        {t("jumpButton")}
      </BaseButton>
    </form>
  );
}
