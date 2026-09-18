"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import useMutationSubmit from "@/app/lib/hooks/useMutationSubmit";
import dateSystemMeta from "@/app/lib/config/calendar/dateSystemMeta";
import { MONTHS_PER_YEAR } from "@/app/lib/calendar/monthLengths";
import { DAYS_PER_WEEK } from "@/app/lib/calendar/weekdayOf";
import createDateSystem from "@/app/lib/data/calendar/createDateSystem";
import updateDateSystem from "@/app/lib/data/calendar/updateDateSystem";
import updateUniversalDateSystem from "@/app/lib/data/calendar/updateUniversalDateSystem";
import DateSystemMetaField from "@/app/lib/definitions/enums/calendar/DateSystemMetaField";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import DateSystemInput from "@/app/lib/definitions/interfaces/calendar/DateSystemInput";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import BespokeFormErrorSummary from "@/app/ui/forms/BespokeFormErrorSummary";
import BaseButton from "@/app/ui/buttons/BaseButton";
import ButtonVariant from "@/app/ui/buttons/BaseButton/ButtonVariant";
import ButtonState from "@/app/ui/buttons/BaseButton/ButtonState";

interface DateSystemFormProps {
  /** The system being edited; absent to create a new one. */
  system?: DateSystem;
  onCancel: () => void;
  onSaved: () => void;
}

/** A name list's draft, padded to its fixed length so every input exists. */
function namesDraft(names: readonly string[] | undefined, length: number) {
  return Array.from({ length }, (_, index) => names?.[index] ?? "");
}

type TextField = Exclude<
  DateSystemMetaField,
  | DateSystemMetaField.anchorYear
  | DateSystemMetaField.monthNames
  | DateSystemMetaField.weekdayNames
>;

/**
 * Creates or edits a date system (SPEC-014 §5.2) — the bespoke editor §7
 * calls for, whose fields' validators and label keys are
 * `dateSystemMeta`'s (ADR-0011). The universal count shows only what the DM
 * may change on it: its name, its year label and abbreviation, its months
 * and weekdays — never an anchor, and it has no years "before".
 *
 * Editing a system's anchor year warns, as soon as the year differs from
 * the saved one, that every date's year in that system re-labels (§5.2);
 * no event moves, so the save itself needs no confirmation.
 */
export default function DateSystemForm({
  system,
  onCancel,
  onSaved,
}: DateSystemFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const { errors, isSaving, submit } = useMutationSubmit();
  const isUniversal = system?.isUniversal ?? false;

  const [text, setText] = useState<Record<TextField, string>>({
    name: system?.name ?? "",
    anchorEvent: system?.anchorEvent ?? "",
    afterLabel: system?.afterLabel ?? "",
    afterAbbrev: system?.afterAbbrev ?? "",
    beforeLabel: system?.beforeLabel ?? "",
    beforeAbbrev: system?.beforeAbbrev ?? "",
  });
  const [anchorYear, setAnchorYear] = useState(
    system === undefined ? "" : String(system.anchorYear)
  );
  const [monthNames, setMonthNames] = useState(() =>
    namesDraft(system?.monthNames, MONTHS_PER_YEAR)
  );
  const [weekdayNames, setWeekdayNames] = useState(() =>
    namesDraft(system?.weekdayNames, DAYS_PER_WEEK)
  );

  const anchorChanged =
    system !== undefined &&
    !isUniversal &&
    anchorYear.trim() !== "" &&
    Number(anchorYear) !== system.anchorYear;

  const label = (field: DateSystemMetaField) =>
    t(dateSystemMeta[field].labelKey);

  const textInput = (field: TextField) => (
    <TextInput
      label={label(field)}
      value={text[field]}
      onChange={(value) =>
        setText((current) => ({ ...current, [field]: String(value) }))
      }
    />
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const common = {
      name: text.name,
      afterLabel: text.afterLabel,
      afterAbbrev: text.afterAbbrev,
      monthNames,
      weekdayNames,
    };
    const full: DateSystemInput = {
      ...common,
      anchorEvent: text.anchorEvent,
      // An empty year is NaN, which the validator refuses as a field error.
      anchorYear: anchorYear.trim() === "" ? Number.NaN : Number(anchorYear),
      beforeLabel: text.beforeLabel,
      beforeAbbrev: text.beforeAbbrev,
    };

    const saved = await submit(() =>
      system === undefined
        ? createDateSystem(full)
        : isUniversal
          ? updateUniversalDateSystem(common)
          : updateDateSystem({ ...full, id: system.id })
    );
    if (!saved) return;

    router.refresh();
    onSaved();
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <BespokeFormErrorSummary errors={errors} meta={dateSystemMeta} />
      <div className="grid gap-3 sm:grid-cols-2">
        {textInput(DateSystemMetaField.name)}
        {!isUniversal && textInput(DateSystemMetaField.anchorEvent)}
        {!isUniversal && (
          <div>
            <TextInput
              label={label(DateSystemMetaField.anchorYear)}
              value={anchorYear}
              onChange={(value) => setAnchorYear(String(value))}
            />
            {anchorChanged && (
              <p
                role="status"
                className="mt-1 rounded-md bg-amber-50 p-2 text-sm text-amber-900"
              >
                {t("calendar.systems.form.anchorWarning")}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {textInput(DateSystemMetaField.afterLabel)}
        {textInput(DateSystemMetaField.afterAbbrev)}
        {!isUniversal && textInput(DateSystemMetaField.beforeLabel)}
        {!isUniversal && textInput(DateSystemMetaField.beforeAbbrev)}
      </div>
      <fieldset className="rounded-md border border-gray-200 p-3">
        <legend className="px-1 text-sm font-medium text-gray-900">
          {label(DateSystemMetaField.monthNames)}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {monthNames.map((name, index) => (
            <TextInput
              key={index}
              label={t("calendar.systems.form.monthName", {
                number: index + 1,
              })}
              value={name}
              onChange={(value) =>
                setMonthNames((current) =>
                  current.map((old, at) => (at === index ? String(value) : old))
                )
              }
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="rounded-md border border-gray-200 p-3">
        <legend className="px-1 text-sm font-medium text-gray-900">
          {label(DateSystemMetaField.weekdayNames)}
        </legend>
        <div className="grid gap-2 sm:grid-cols-4">
          {weekdayNames.map((name, index) => (
            <TextInput
              key={index}
              label={t("calendar.systems.form.weekdayName", {
                number: index + 1,
              })}
              value={name}
              onChange={(value) =>
                setWeekdayNames((current) =>
                  current.map((old, at) => (at === index ? String(value) : old))
                )
              }
            />
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2">
        <BaseButton
          buttonState={isSaving ? ButtonState.Loading : ButtonState.Default}
        >
          {system === undefined
            ? t("calendar.systems.form.createButton")
            : t("common.form.save")}
        </BaseButton>
        <BaseButton
          onClick={onCancel}
          variant={ButtonVariant.secondary}
          buttonState={isSaving ? ButtonState.Disabled : ButtonState.Default}
        >
          {t("common.form.cancel")}
        </BaseButton>
      </div>
    </form>
  );
}
