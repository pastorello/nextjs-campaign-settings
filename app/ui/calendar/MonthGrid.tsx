"use client";

import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { adjacentMonth } from "@/app/lib/calendar/adjacentMonth";
import { formatHour } from "@/app/lib/calendar/formatHour";
import { formatSystemYear } from "@/app/lib/calendar/formatWorldDate";
import { monthRange } from "@/app/lib/calendar/monthRange";
import type MoonPhase from "@/app/lib/calendar/MoonPhase";
import type {
  GridEventDates,
  MonthDayEvent,
  MonthView,
  MonthViewDay,
} from "@/app/lib/calendar/MonthView";
import { systemYearFromUniversalYear } from "@/app/lib/calendar/systemYear";
import type ZodiacSign from "@/app/lib/calendar/ZodiacSign";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import Modal from "@/app/ui/components/Modal";
import { monthGridKeyTarget } from "./monthGridKeyTarget";
import useMonthGridHref from "./useMonthGridHref";

/** The symbols drawn for each phase and sign; the words are copy. */
const MOON_GLYPHS: Record<MoonPhase, string> = {
  new: "🌑",
  waxingCrescent: "🌒",
  firstQuarter: "🌓",
  waxingGibbous: "🌔",
  full: "🌕",
  waningGibbous: "🌖",
  lastQuarter: "🌗",
  waningCrescent: "🌘",
};

const ZODIAC_GLYPHS: Record<ZodiacSign, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  ophiuchus: "⛎",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

interface GridEvent extends GridEventDates {
  id: number;
  title: string;
}

/** How one event is drawn in a day cell. */
export interface MonthGridItemStyle {
  className: string;
  testId: string;
  /** Read before the title by a screen reader, e.g. "World history". */
  label?: string | undefined;
}

interface MonthGridProps<Event extends GridEvent> {
  month: MonthView<Event>;
  /** The system whose weekday and month names, and years, are shown. */
  displaySystem: DateSystem;
  /**
   * The campaign's current day (SPEC-014 §5.5): highlighted, the days
   * before it dimmed. Absent on world history, which has no today.
   */
  today?: number | null | undefined;
  itemKey: (event: Event) => string | number;
  itemStyle: (event: Event) => MonthGridItemStyle;
  /** Whether an event opens its edit form; all do when absent. */
  isEditable?: ((event: Event) => boolean) | undefined;
  /** The edit form the list uses; `close` ends it. */
  renderForm: (event: Event, close: () => void) => ReactNode;
}

/**
 * One month as a calendar (SPEC-014 §5.6, T7), shared by world history and
 * the campaign calendar: seven columns headed by the displayed system's
 * weekday names, each day with its number, moon phase (when the moon has
 * a reference), zodiac sign and events. A multi-day event appears on each
 * of its days, marked where it continues; a yearly event on every year's
 * page. An editable event is a button that opens the list's edit form.
 *
 * An ARIA grid (T9): one day is the grid's single Tab stop (today when
 * shown, else the 1st, then wherever the viewer last was); arrows move a
 * day or a week, Home/End to the row's ends, PageUp/PageDown to the
 * previous/next month (`monthGridKeyTarget`). Only the focused day's events
 * are in the Tab order, so Tab goes from the day into its events and then
 * out of the grid, instead of through every event of the month.
 */
export default function MonthGrid<Event extends GridEvent>({
  month,
  displaySystem,
  today = null,
  itemKey,
  itemStyle,
  isEditable = () => true,
  renderForm,
}: MonthGridProps<Event>) {
  const t = useTranslations("calendar");
  const [editing, setEditing] = useState<Event | null>(null);
  const router = useRouter();
  const monthHref = useMonthGridHref();
  const captionId = useId();

  /*
   * The focused day, tied to the month it was chosen in: a different
   * month (the navigation buttons, a jump) starts from its default day.
   * `move` asks for DOM focus — set by a key, not by a click or Tab, which
   * already put the focus there.
   */
  const [focused, setFocused] = useState<{
    firstDay: number;
    day: number;
    move: boolean;
  } | null>(null);
  const daysInMonth = month.days.length;
  const todayInMonth =
    today !== null && today >= month.firstDay && today <= month.lastDay
      ? today - month.firstDay + 1
      : null;
  const activeDay =
    focused !== null && focused.firstDay === month.firstDay
      ? Math.min(focused.day, daysInMonth)
      : (todayInMonth ?? 1);
  const cellRefs = useRef(new Map<number, HTMLTableCellElement>());

  useEffect(() => {
    if (focused?.move && focused.firstDay === month.firstDay) {
      cellRefs.current.get(activeDay)?.focus();
    }
  }, [focused, month.firstDay, activeDay]);

  function turnMonth(offset: -1 | 1) {
    const target = adjacentMonth(month, offset);
    if (target === null) return;
    setFocused({
      firstDay: monthRange(target).firstDay,
      day: activeDay,
      move: true,
    });
    router.push(monthHref(target));
  }

  function handleKeyDown(
    cell: MonthViewDay<Event>,
    keyEvent: KeyboardEvent<HTMLTableCellElement>
  ) {
    if (keyEvent.altKey || keyEvent.ctrlKey || keyEvent.metaKey) return;
    const target = monthGridKeyTarget(keyEvent.key, {
      day: cell.day,
      weekday: cell.weekday,
      daysInMonth,
      weekLength: displaySystem.weekdayNames.length,
    });
    if (target === null) return;
    keyEvent.preventDefault();
    if (target.kind === "month") turnMonth(target.offset);
    else setFocused({ firstDay: month.firstDay, day: target.day, move: true });
  }

  const caption = t("grid.caption", {
    month: displaySystem.monthNames[month.monthIndex] ?? "",
    year: formatSystemYear(
      systemYearFromUniversalYear(
        month.universalYear,
        displaySystem.anchorYear
      ),
      displaySystem
    ),
  });

  function eventContent(placement: MonthDayEvent<Event>) {
    const { event, startHour, endHour } = placement;
    const { label } = itemStyle(event);
    return (
      <>
        {label !== undefined && <span className="sr-only">{label}: </span>}
        {placement.continuesFromBefore && (
          <>
            <span aria-hidden="true">← </span>
            <span className="sr-only">({t("grid.continuesFromBefore")}) </span>
          </>
        )}
        {startHour !== null && <span>{formatHour(startHour)} </span>}
        <span>{event.title}</span>
        {endHour !== null && (
          <span>
            {" "}
            {t("history.list.rangeSeparator")} {formatHour(endHour)}
          </span>
        )}
        {placement.continuesAfter && (
          <>
            <span aria-hidden="true"> →</span>
            <span className="sr-only"> ({t("grid.continuesAfter")})</span>
          </>
        )}
      </>
    );
  }

  function dayCell(cell: MonthViewDay<Event>) {
    const isToday = today !== null && cell.universalDay === today;
    const isPast = today !== null && cell.universalDay < today;
    const isActive = cell.day === activeDay;
    const moon =
      cell.moonPhase === null
        ? null
        : t("grid.moon", { phase: t(`moonPhases.${cell.moonPhase}`) });
    const zodiac = t("grid.zodiac", {
      sign: t(`zodiacSigns.${cell.zodiacSign}`),
    });

    return (
      <td
        key={cell.universalDay}
        ref={(element) => {
          if (element) cellRefs.current.set(cell.day, element);
          else cellRefs.current.delete(cell.day);
        }}
        role="gridcell"
        tabIndex={isActive ? 0 : -1}
        onKeyDown={(keyEvent) => handleKeyDown(cell, keyEvent)}
        onFocus={() => {
          if (!isActive) {
            setFocused({
              firstDay: month.firstDay,
              day: cell.day,
              move: false,
            });
          }
        }}
        className={clsx(
          "h-24 border border-gray-200 p-1 align-top focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600",
          isToday && "bg-sky-50 ring-2 ring-inset ring-blue-600",
          isPast && "bg-gray-50 text-gray-600"
        )}
        aria-current={isToday ? "date" : undefined}
        data-testid="month-grid-day"
        data-day={cell.day}
      >
        <div className="flex items-start justify-between gap-1 text-xs">
          {/*
           * Today and the past are not told by colour alone: today's word
           * is shown, a past day's number is struck through.
           */}
          <span className="font-semibold">
            <span className={clsx(isPast && "line-through")}>{cell.day}</span>
            {isToday && (
              <span className="font-normal"> ({t("grid.isToday")})</span>
            )}
            {isPast && <span className="sr-only"> ({t("grid.isPast")})</span>}
          </span>
          <span className="flex gap-1">
            {moon !== null && cell.moonPhase !== null && (
              <span title={moon} data-testid="month-grid-moon">
                <span aria-hidden="true">{MOON_GLYPHS[cell.moonPhase]}</span>
                <span className="sr-only">{moon}</span>
              </span>
            )}
            <span title={zodiac}>
              <span aria-hidden="true">{ZODIAC_GLYPHS[cell.zodiacSign]}</span>
              <span className="sr-only">{zodiac}</span>
            </span>
          </span>
        </div>
        {cell.events.length > 0 && (
          <ul className="mt-1 space-y-1">
            {cell.events.map((placement) => {
              const { event } = placement;
              const { className, testId } = itemStyle(event);
              const itemClass = clsx(
                "block w-full rounded px-1 text-left text-xs break-words",
                className
              );
              return (
                <li
                  key={`${itemKey(event)}-${placement.occurrenceStartDay}`}
                  data-testid={testId}
                >
                  {isEditable(event) ? (
                    <button
                      type="button"
                      tabIndex={isActive ? 0 : -1}
                      className={clsx(
                        itemClass,
                        "hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
                      )}
                      onClick={() => setEditing(event)}
                    >
                      {eventContent(placement)}
                    </button>
                  ) : (
                    <span className={itemClass}>{eventContent(placement)}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </td>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table
        role="grid"
        aria-labelledby={captionId}
        className="w-full min-w-[640px] table-fixed border-collapse"
        data-testid="month-grid"
      >
        <caption
          id={captionId}
          className="mb-2 text-left text-xl font-semibold"
        >
          {caption}
        </caption>
        <thead>
          <tr role="row">
            {displaySystem.weekdayNames.map((name, weekday) => (
              <th
                key={weekday}
                scope="col"
                role="columnheader"
                className="border border-gray-200 bg-gray-50 p-1 text-xs font-medium"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {month.weeks.map((week, row) => (
            <tr key={row} role="row">
              {week.map((cell, column) =>
                cell === null ? (
                  <td
                    key={`blank-${column}`}
                    role="gridcell"
                    className="border border-gray-200 bg-gray-100"
                  />
                ) : (
                  dayCell(cell)
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal
          isOpen={editing !== null}
          setIsOpen={(next) => {
            if (!next) setEditing(null);
          }}
          title={editing.title}
        >
          {renderForm(editing, () => setEditing(null))}
        </Modal>
      )}
    </div>
  );
}
