"use client";

import { useTranslations } from "next-intl";

import calendarEventMeta from "@/app/lib/config/calendarEvent/calendarEventMeta";
import CalendarEventMetaField from "@/app/lib/definitions/enums/calendar/CalendarEventMetaField";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import RichTextInput from "@/app/ui/forms/inputs/RichTextInput";
import CheckboxInput from "@/app/ui/forms/inputs/CheckboxInput";
import { CalendarEventDraft } from "./calendarEventDraft";
import WorldDateInput from "./WorldDateInput";

interface CalendarEventFieldsProps {
  draft: CalendarEventDraft;
  onChange: (changes: Partial<CalendarEventDraft>) => void;
  systems: readonly DateSystem[];
  /** The system the date inputs open in — the one the page shows. */
  displaySystemId: number;
  /** The form's field errors, already translated (`resolveFieldErrors`). */
  fieldErrors: Record<string, string[]>;
}

/**
 * The fields every event form has (SPEC-014 §5.4): title, description, a
 * start and an optional end — each a `WorldDateInput` — and "repeats every
 * year". Labels are `calendarEventMeta`'s. Shared by the world history
 * form (T5) and the campaign calendar's (T6), which add their links or
 * owner below; the layout is the forms' own (ADR-0011).
 */
export default function CalendarEventFields({
  draft,
  onChange,
  systems,
  displaySystemId,
  fieldErrors,
}: CalendarEventFieldsProps) {
  const t = useTranslations();
  const label = (field: CalendarEventMetaField) =>
    t(calendarEventMeta[field].labelKey);

  // A date's refusal can land on its day or its hour; the input shows both.
  const dateError = (day: string, hour: string) => {
    const messages = [
      ...(fieldErrors[day] ?? []),
      ...(fieldErrors[hour] ?? []),
    ];
    return messages.length === 0 ? undefined : messages.join(", ");
  };

  return (
    <>
      <TextInput
        label={label(CalendarEventMetaField.title)}
        value={draft.title}
        onChange={(value) => onChange({ title: String(value) })}
      />
      <RichTextInput
        label={label(CalendarEventMetaField.description)}
        value={draft.description}
        onChange={(value) => onChange({ description: String(value) })}
        tall={calendarEventMeta.description.tall}
      />
      <WorldDateInput
        legend={label(CalendarEventMetaField.startDay)}
        systems={systems}
        value={draft.start}
        onChange={(start) => onChange({ start })}
        initialSystemId={displaySystemId}
        error={dateError("startDay", "startHour")}
      />
      <CheckboxInput
        label={t("calendar.event.form.hasEnd")}
        value={draft.hasEnd}
        onChange={(value) => onChange({ hasEnd: value === true })}
      />
      {draft.hasEnd && (
        <WorldDateInput
          legend={label(CalendarEventMetaField.endDay)}
          systems={systems}
          value={draft.end}
          onChange={(end) => onChange({ end })}
          initialSystemId={displaySystemId}
          error={dateError("endDay", "endHour")}
        />
      )}
      <CheckboxInput
        label={label(CalendarEventMetaField.repeatsYearly)}
        value={draft.repeatsYearly}
        onChange={(value) => onChange({ repeatsYearly: value === true })}
      />
    </>
  );
}
