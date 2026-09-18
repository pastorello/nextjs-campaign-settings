import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  humanCountFixture as human,
  universalCountFixture as universal,
} from "@/app/lib/calendar/dateSystemFixtures";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));

const push = vi.fn();
let search = "view=grid&year=0&month=1&place=4&page=2";
vi.mock("next/navigation", () => ({
  usePathname: () => "/it/dashboard/dnd5e/world/history",
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ push }),
}));

import CalendarViewSwitch from "./CalendarViewSwitch";
import MonthGridNavigation from "./MonthGridNavigation";

const PATH = "/it/dashboard/dnd5e/world/history";
const systems = [universal, human];

function renderNavigation(
  month = { universalYear: 5770, monthIndex: 0 },
  today: number | null = null
) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <MonthGridNavigation
        month={month}
        systems={systems}
        displaySystem={human}
        today={today}
      />
    </NextIntlClientProvider>
  );
}

describe("MonthGridNavigation (SPEC-014 T7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = "view=grid&year=0&month=1&place=4&page=2";
  });

  it("links the previous and next month across a year's end, keeping the filters", () => {
    renderNavigation();

    expect(
      screen.getByRole("link", { name: "Previous month" })
    ).toHaveAttribute("href", `${PATH}?view=grid&year=5769&month=12&place=4`);
    expect(screen.getByRole("link", { name: "Next month" })).toHaveAttribute(
      "href",
      `${PATH}?view=grid&year=5770&month=2&place=4`
    );
  });

  it("has no month before the dawn of time", () => {
    renderNavigation({ universalYear: 0, monthIndex: 0 });

    expect(
      screen.queryByRole("link", { name: "Previous month" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous month" })
    ).toBeDisabled();
  });

  it("links today only when there is one", () => {
    renderNavigation(undefined, 365 + 40);

    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute(
      "href",
      `${PATH}?view=grid&year=1&month=2&place=4`
    );
  });

  it("offers no today on world history", () => {
    renderNavigation();

    expect(
      screen.queryByRole("link", { name: "Today" })
    ).not.toBeInTheDocument();
  });

  it("jumps to the month of a date typed in the displayed system", () => {
    renderNavigation();

    // The input opens in the displayed system at the month's first day.
    fireEvent.change(screen.getByLabelText("Year"), {
      target: { value: "-330" },
    });
    fireEvent.change(screen.getByLabelText("Month"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));

    // Year −330 of the human count is universal year 5440.
    expect(push).toHaveBeenCalledWith(
      `${PATH}?view=grid&year=5440&month=6&place=4`
    );
  });
});

describe("CalendarViewSwitch (SPEC-014 T7)", () => {
  beforeEach(() => {
    search = "place=4&view=grid";
  });

  it("links both views, keeping the filters, and marks the current one", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <CalendarViewSwitch view="grid" />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("link", { name: "List" })).toHaveAttribute(
      "href",
      `${PATH}?place=4`
    );
    const month = screen.getByRole("link", { name: "Month" });
    expect(month).toHaveAttribute("href", `${PATH}?place=4&view=grid`);
    expect(month).toHaveAttribute("aria-current", "page");
  });
});
