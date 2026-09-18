"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { formatHour } from "@/app/lib/calendar/formatHour";
import {
  parseWorldDateFields,
  type WorldDateSubField,
} from "@/app/lib/calendar/parseWorldDateFields";
import { resolveDisplayDateSystem } from "@/app/lib/calendar/resolveDisplayDateSystem";
import type WorldDateFields from "@/app/lib/calendar/WorldDateFields";
import { worldDateFieldsFromDay } from "@/app/lib/calendar/worldDateFieldsFromDay";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import WorldDateValue from "@/app/lib/definitions/interfaces/calendar/WorldDateValue";
import WorldDate from "./WorldDate";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const CONTROL_CLASS =
  "h-[32px] w-full rounded-md border px-[5px] text-sm focus:ring-indigo-500 aria-invalid:border-red-500";

interface WorldDateInputProps {
  /** The field's label, resolved from its `PageMeta.labelKey` by the form. */
  legend: string;
  /** Every date system, as `fetchDateSystems` returns them. */
  systems: readonly DateSystem[];
  /**
   * The starting value. Read once: the input keeps its own draft (a year
   * half-typed is not a date yet) and reports every change through
   * `onChange`, like the other bespoke forms' fields.
   */
  value: WorldDateValue;
  onChange: (value: WorldDateValue) => void;
  /** The system the input opens in; the world default when absent. */
  initialSystemId?: number | undefined;
  /**
   * A refusal the fields cannot see on their own — "end before start" from
   * the form's validator — already translated, shown under the fieldset.
   */
  error?: string | undefined;
}

/**
 * Entering a date (SPEC-014 §5.8): a date system (the default unless
 * switched), the year in that system, the month by name, the day and an
 * optional hour, converted to a universal day as the DM types. Out-of-range
 * days and dates before the dawn of time are flagged on the field that
 * causes them, with the same keys `universalDayValidator` refuses with on
 * the server.
 *
 * A bespoke control, not a `PageMeta` control type (SPEC-014 §7, T4): its
 * value is two columns (`startDay` + `startHour`) and it needs the date
 * systems as data, which no `ControlProps` control receives; the date
 * fields still declare their `PageMeta` validator and label key
 * (`universalDayValidator`, `worldHourValidator`), and the form hands them
 * to this control — ADR-0011's "shared either way".
 */
export default function WorldDateInput({
  legend,
  systems,
  value,
  onChange,
  initialSystemId,
  error,
}: WorldDateInputProps) {
  const t = useTranslations();
  const id = useId();
  const [system, setSystem] = useState(() =>
    resolveDisplayDateSystem(systems, initialSystemId ?? null)
  );
  const [fields, setFields] = useState<WorldDateFields>(() =>
    system === undefined
      ? { year: "", monthIndex: 0, day: "", hour: value.hour }
      : worldDateFieldsFromDay(value.universalDay, value.hour, system)
  );

  if (system === undefined) return null;

  const parsed = parseWorldDateFields(fields, system);

  function update(nextFields: WorldDateFields, nextSystem: DateSystem) {
    setFields(nextFields);
    const next = parseWorldDateFields(nextFields, nextSystem);
    onChange({ universalDay: next.universalDay, hour: nextFields.hour });
  }

  function changeSystem(systemId: number) {
    const nextSystem = systems.find((candidate) => candidate.id === systemId);
    if (!nextSystem) return;
    setSystem(nextSystem);
    // A date already typed stays the same day, re-labelled in the new
    // system; a half-typed one keeps its fields and is re-read there.
    update(
      parsed.universalDay === null
        ? fields
        : worldDateFieldsFromDay(parsed.universalDay, fields.hour, nextSystem),
      nextSystem
    );
  }

  const errorId = (field: WorldDateSubField) => `${id}-${field}-error`;
  const errorProps = (field: WorldDateSubField) =>
    parsed.errors[field]
      ? { "aria-invalid": true, "aria-describedby": errorId(field) }
      : {};
  const errorText = (field: WorldDateSubField) => {
    const message = parsed.errors[field];
    if (!message) return null;
    return (
      <p id={errorId(field)} className="mt-1 text-sm text-red-600">
        {t(`common.fieldErrors.${message.key}`, message.values)}
      </p>
    );
  };

  return (
    <fieldset
      className="rounded-md border border-gray-200 p-3"
      aria-describedby={error === undefined ? undefined : `${id}-error`}
    >
      <legend className="px-1 text-sm font-medium text-gray-900">
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="col-span-2 sm:col-span-5">
          <label htmlFor={`${id}-system`} className="text-sm text-gray-700">
            {t("calendar.input.system")}
          </label>
          <select
            id={`${id}-system`}
            className={CONTROL_CLASS}
            value={system.id}
            onChange={(event) => changeSystem(Number(event.target.value))}
          >
            {systems.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-year`} className="text-sm text-gray-700">
            {t("calendar.input.year")}
          </label>
          <input
            id={`${id}-year`}
            type="number"
            step={1}
            className={CONTROL_CLASS}
            value={fields.year}
            onChange={(event) =>
              update({ ...fields, year: event.target.value }, system)
            }
            {...errorProps("year")}
          />
          {errorText("year")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-month`} className="text-sm text-gray-700">
            {t("calendar.input.month")}
          </label>
          <select
            id={`${id}-month`}
            className={CONTROL_CLASS}
            value={fields.monthIndex}
            onChange={(event) =>
              update(
                { ...fields, monthIndex: Number(event.target.value) },
                system
              )
            }
          >
            {system.monthNames.map((name, index) => (
              <option key={index} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-day`} className="text-sm text-gray-700">
            {t("calendar.input.day")}
          </label>
          <input
            id={`${id}-day`}
            type="number"
            min={1}
            max={31}
            step={1}
            className={CONTROL_CLASS}
            value={fields.day}
            onChange={(event) =>
              update({ ...fields, day: event.target.value }, system)
            }
            {...errorProps("day")}
          />
          {errorText("day")}
        </div>
        <div>
          <label htmlFor={`${id}-hour`} className="text-sm text-gray-700">
            {t("calendar.input.hour")}
          </label>
          <select
            id={`${id}-hour`}
            className={CONTROL_CLASS}
            value={fields.hour ?? ""}
            onChange={(event) =>
              update(
                {
                  ...fields,
                  hour:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                },
                system
              )
            }
          >
            <option value="">{t("calendar.input.noHour")}</option>
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {formatHour(hour)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Always mounted, so a screen reader announces the date as it forms. */}
      <p className="mt-2 text-sm text-gray-600" aria-live="polite">
        {parsed.universalDay !== null && (
          <>
            {t("calendar.input.preview")}{" "}
            <WorldDate
              universalDay={parsed.universalDay}
              hour={fields.hour}
              system={system}
            />
          </>
        )}
      </p>
      {error !== undefined && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
