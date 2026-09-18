import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { buildMonthView } from "@/app/lib/calendar/buildMonthView";
import { humanCountFixture as human } from "@/app/lib/calendar/dateSystemFixtures";
import { dateToUniversalDay } from "@/app/lib/calendar/dateToUniversalDay";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard/dnd5e/world/history",
  useSearchParams: () => new URLSearchParams("view=grid&place=4"),
  useRouter: () => ({ push }),
}));

import MonthGrid from "./MonthGrid";

interface Item {
  id: number;
  title: string;
  kind: "own" | "other";
  startDay: number;
  startHour: number | null;
  endDay: number | null;
  endHour: number | null;
  repeatsYearly: boolean;
}

// The anchor year's first month: "Brumaio 0 d.C." in the human count.
const MONTH = { universalYear: human.anchorYear, monthIndex: 0 };
const day = (dayOfMonth: number) =>
  dateToUniversalDay({ ...MONTH, day: dayOfMonth });

const item = (overrides: Partial<Item> & { id: number; title: string }) => ({
  kind: "own" as const,
  startDay: day(1),
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
  ...overrides,
});

const items: Item[] = [
  item({ id: 1, title: "Council", startDay: day(10), startHour: 14 }),
  item({ id: 2, title: "March", startDay: day(3), endDay: day(5) }),
  item({
    id: 3,
    title: "Old feast",
    kind: "other",
    startDay: day(7) - 3650,
    repeatsYearly: true,
  }),
];

function renderGrid(today: number | null = null) {
  const renderForm = vi.fn((event: Item, close: () => void) => (
    <div data-testid="edit-form">
      {event.title}
      <button type="button" onClick={close}>
        close
      </button>
    </div>
  ));
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <MonthGrid
        month={buildMonthView(MONTH, items, day(1))}
        displaySystem={human}
        today={today}
        itemKey={(event) => event.id}
        itemStyle={(event) => ({
          className: event.kind,
          testId: `grid-${event.kind}`,
          label: event.kind === "other" ? "World history" : undefined,
        })}
        isEditable={(event) => event.kind === "own"}
        renderForm={renderForm}
      />
    </NextIntlClientProvider>
  );
  return { renderForm };
}

const dayCell = (dayOfMonth: number) => {
  const cell = screen
    .getAllByTestId("month-grid-day")
    .find((element) => element.dataset.day === String(dayOfMonth));
  if (!cell) throw new Error(`No cell for day ${dayOfMonth}`);
  return cell;
};

describe("MonthGrid (SPEC-014 T7)", () => {
  it("heads seven columns with the displayed system's weekdays, under a caption in that system", () => {
    renderGrid();

    const table = screen.getByRole("grid", { name: "Brumaio 0 d.C." });
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual(
      human.weekdayNames
    );
    expect(screen.getAllByTestId("month-grid-day")).toHaveLength(31);
  });

  it("shows each day's moon phase and zodiac sign in words", () => {
    renderGrid();

    expect(dayCell(1)).toHaveTextContent("Moon: New moon");
    expect(dayCell(15)).toHaveTextContent("Moon: Full moon");
    expect(dayCell(19)).toHaveTextContent("Sign: Sagittarius");
    expect(dayCell(20)).toHaveTextContent("Sign: Capricorn");
  });

  it("places events with their hours, spanning a multi-day one", () => {
    renderGrid();

    expect(within(dayCell(10)).getByRole("button")).toHaveTextContent(
      "14:00 Council"
    );
    for (const spanned of [3, 4, 5]) {
      expect(dayCell(spanned)).toHaveTextContent("March");
    }
    expect(dayCell(4)).toHaveTextContent("continued from the day before");
    expect(dayCell(4)).toHaveTextContent("continues the next day");
    expect(dayCell(6)).not.toHaveTextContent("March");
  });

  it("shows a yearly event from an earlier year, read-only and labelled", () => {
    renderGrid();

    const feast = within(dayCell(7)).getByTestId("grid-other");
    expect(feast).toHaveTextContent("World history: Old feast");
    expect(within(feast).queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens the edit form from an event", () => {
    const { renderForm } = renderGrid();

    fireEvent.click(within(dayCell(10)).getByRole("button"));

    expect(screen.getByTestId("edit-form")).toHaveTextContent("Council");
    expect(renderForm).toHaveBeenCalledWith(items[0], expect.any(Function));
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(screen.queryByTestId("edit-form")).not.toBeInTheDocument();
  });

  it("highlights today and dims the days before it", () => {
    renderGrid(day(12));

    expect(dayCell(12)).toHaveAttribute("aria-current", "date");
    expect(dayCell(12)).toHaveTextContent("(today)");
    expect(dayCell(11)).toHaveTextContent("(past)");
    expect(dayCell(13)).not.toHaveTextContent("(past)");
  });

  it("tells today and the past apart without colour", () => {
    renderGrid(day(12));

    // Today's word is visible, not screen-reader only.
    expect(within(dayCell(12)).getByText("(today)")).not.toHaveClass("sr-only");
    // A past day's number is struck through; a later one's is not.
    expect(within(dayCell(11)).getByText("11")).toHaveClass("line-through");
    expect(within(dayCell(13)).getByText("13")).not.toHaveClass("line-through");
  });

  it("marks nothing without a today", () => {
    renderGrid();

    expect(document.querySelector('[aria-current="date"]')).toBeNull();
    expect(dayCell(1)).not.toHaveTextContent("(past)");
  });
});

describe("MonthGrid keyboard navigation (SPEC-014 T9)", () => {
  const tabStops = () =>
    screen
      .getAllByTestId("month-grid-day")
      .filter((cell) => cell.tabIndex === 0)
      .map((cell) => cell.dataset.day);

  it("has one day as its Tab stop: today when shown, else the 1st", () => {
    renderGrid(day(12));
    expect(tabStops()).toEqual(["12"]);
  });

  it("starts on the 1st without a today in the month", () => {
    renderGrid();
    expect(tabStops()).toEqual(["1"]);
  });

  it("moves the focus between days with the arrow keys, Home and End", () => {
    renderGrid();
    dayCell(1).focus();

    fireEvent.keyDown(dayCell(1), { key: "ArrowRight" });
    expect(document.activeElement).toBe(dayCell(2));
    fireEvent.keyDown(dayCell(2), { key: "ArrowDown" });
    expect(document.activeElement).toBe(dayCell(9));
    fireEvent.keyDown(dayCell(9), { key: "ArrowUp" });
    expect(document.activeElement).toBe(dayCell(2));
    fireEvent.keyDown(dayCell(2), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(dayCell(1));

    // Home and End go to the ends of day 9's row, whatever its weekday.
    const daysInRow = Array.from(
      dayCell(9)
        .closest("tr")
        ?.querySelectorAll<HTMLElement>('[data-testid="month-grid-day"]') ?? []
    ).map((cell) => cell.dataset.day);
    fireEvent.keyDown(dayCell(9), { key: "Home" });
    expect(document.activeElement).toBe(dayCell(Number(daysInRow[0])));
    fireEvent.keyDown(dayCell(Number(daysInRow[0])), { key: "End" });
    expect(document.activeElement).toBe(dayCell(Number(daysInRow.at(-1))));
    expect(tabStops()).toEqual([daysInRow.at(-1)]);
  });

  it("keeps only the focused day's events in the Tab order", () => {
    renderGrid();
    const council = within(dayCell(10)).getByRole("button");
    expect(council.tabIndex).toBe(-1);

    dayCell(1).focus();
    fireEvent.keyDown(dayCell(1), { key: "ArrowDown" });
    fireEvent.keyDown(dayCell(8), { key: "ArrowRight" });
    fireEvent.keyDown(dayCell(9), { key: "ArrowRight" });

    expect(document.activeElement).toBe(dayCell(10));
    expect(council.tabIndex).toBe(0);
  });

  it("turns the month with PageUp and PageDown, keeping the filters", () => {
    push.mockClear();
    renderGrid();
    dayCell(1).focus();

    fireEvent.keyDown(dayCell(1), { key: "PageDown" });
    expect(push).toHaveBeenLastCalledWith(
      `/en/dashboard/dnd5e/world/history?view=grid&place=4&year=${human.anchorYear}&month=2`
    );
    fireEvent.keyDown(dayCell(1), { key: "PageUp" });
    expect(push).toHaveBeenCalledTimes(2);
  });

  it("leaves other keys and modified arrows alone", () => {
    renderGrid();
    dayCell(1).focus();

    fireEvent.keyDown(dayCell(1), { key: "ArrowRight", ctrlKey: true });
    fireEvent.keyDown(dayCell(1), { key: "Enter" });

    expect(document.activeElement).toBe(dayCell(1));
  });
});
