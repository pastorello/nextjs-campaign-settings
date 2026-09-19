import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { universalCountFixture as universal } from "@/app/lib/calendar/dateSystemFixtures";

// An async Server Component that reads the database (SPEC-019 T5); a
// pass-through here, recording what the page asked it to resolve.
const { resolvedValues } = vi.hoisted(() => ({ resolvedValues: vi.fn() }));
vi.mock("@/app/ui/richText/ResolvedRecordLinks", () => ({
  default: ({
    values,
    children,
  }: {
    values: unknown;
    children: React.ReactNode;
  }) => {
    resolvedValues(values);
    return children;
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const fetchCampaign = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/fetchCampaign", () => ({
  default: (...args: unknown[]) => fetchCampaign(...args),
}));
const fetchCampaignEvents = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/fetchCampaignEvents", () => ({
  default: (...args: unknown[]) => fetchCampaignEvents(...args),
}));
vi.mock("@/app/lib/data/calendar/fetchCampaignScenes", () => ({
  default: () => Promise.resolve([]),
}));
const fetchWorldHistoryBetween = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/fetchWorldHistoryBetween", () => ({
  default: (...args: unknown[]) => fetchWorldHistoryBetween(...args),
}));
vi.mock("@/app/lib/data/calendar/fetchDateSystems", () => ({
  default: () => Promise.resolve([universal]),
}));
vi.mock("@/app/lib/data/calendar/readDisplayDateSystemId", () => ({
  default: () => Promise.resolve(null),
}));

vi.mock("@/app/lib/data/calendar/fetchCalendarSettings", () => ({
  default: () => Promise.resolve({ moonNewMoonDay: 3 }),
}));
const findEdgeEventDay = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/findEdgeEventDay", () => ({
  default: (...args: unknown[]) => findEdgeEventDay(...args),
}));

vi.mock("@/app/ui/calendar/DateSystemToggle", () => ({ default: () => null }));
vi.mock("@/app/ui/calendar/CalendarViewSwitch", () => ({
  default: ({ view }: { view: string }) => (
    <div data-testid="view-switch">{view}</div>
  ),
}));
vi.mock("@/app/ui/calendar/MonthGridNavigation", () => ({
  default: ({ today }: { today: number | null }) => (
    <div data-testid="grid-navigation">{String(today)}</div>
  ),
}));
vi.mock("@/app/ui/calendar/CampaignMonthGrid", () => ({
  default: ({
    month,
    events,
    history,
    moonReferenceDay,
  }: {
    month: { universalYear: number; monthIndex: number };
    events: unknown[];
    history: unknown[];
    moonReferenceDay: number | null;
  }) => (
    <div data-testid="grid">{`${month.universalYear}-${month.monthIndex}/${events.length}/${history.length}/${moonReferenceDay}`}</div>
  ),
}));
vi.mock("@/app/ui/calendar/CurrentDayForm", () => ({
  default: ({ currentDay }: { currentDay: number | null }) => (
    <div data-testid="current-day">{String(currentDay)}</div>
  ),
}));
vi.mock("@/app/ui/calendar/CampaignCalendarFilters", () => ({
  default: ({ adventureId }: { adventureId: number | null }) => (
    <div data-testid="filters">{String(adventureId)}</div>
  ),
}));
vi.mock("@/app/ui/calendar/CampaignCalendarList", () => ({
  default: ({
    events,
    history,
    today,
  }: {
    events: unknown[];
    history: unknown[];
    today: number | null;
  }) => (
    <div data-testid="list">{`${events.length}/${history.length}/${today}`}</div>
  ),
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

import CampaignCalendarPage, { generateMetadata } from "./page";

function routeProps(system = "dnd5e", searchParams = {}) {
  return {
    params: Promise.resolve({ locale: "it", system }),
    searchParams: Promise.resolve(searchParams),
  };
}

const campaign = {
  id: 1,
  title: "The Silver Coast",
  synopsis: null,
  partySize: 5,
  system: "dnd5e",
  currentDay: 400,
  adventures: [{ id: 10, title: "Into the Mire" }],
};

const event = { id: 1, startDay: 10, endDay: null };

describe("Campaign calendar page (SPEC-014 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCampaignEvents.mockResolvedValue([event]);
    fetchWorldHistoryBetween.mockResolvedValue([{ id: 9 }]);
  });

  it("titles the page from the calendar.campaign catalogue", async () => {
    expect((await generateMetadata()).title).toBe("title");
  });

  it("says there is no campaign under this system, linking to the campaign page", async () => {
    fetchCampaign.mockResolvedValue(null);

    render(await CampaignCalendarPage(routeProps()));

    expect(screen.getByText("noCampaign")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "goToCampaign" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/campaign"
    );
    expect(fetchCampaignEvents).not.toHaveBeenCalled();
  });

  it("shows today, the events and the world history of their years", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(await CampaignCalendarPage(routeProps()));

    expect(fetchCampaign).toHaveBeenCalledWith("dnd5e");
    expect(screen.getByTestId("current-day")).toHaveTextContent("400");
    expect(screen.getByTestId("list")).toHaveTextContent("1/1/400");
    // Day 10 is in year 0, today (day 400) in year 1: both whole years,
    // with the yearly events first held before them (T9).
    expect(fetchWorldHistoryBetween).toHaveBeenCalledWith(0, 729, true);
    expect(fetchCampaignEvents).toHaveBeenCalledWith(1, null);
  });

  it("lists a yearly world history event in every year shown, however early it started (T9)", async () => {
    fetchCampaign.mockResolvedValue(campaign);
    fetchWorldHistoryBetween.mockResolvedValue([
      {
        id: 9,
        title: "Founding day",
        startDay: 100 - 3650,
        endDay: null,
        repeatsYearly: true,
      },
    ]);

    render(await CampaignCalendarPage(routeProps()));

    // Years 0 and 1 are shown: the founding day once in each.
    expect(screen.getByTestId("list")).toHaveTextContent("1/2/400");
  });

  it("reads no world history with no events and no current day", async () => {
    fetchCampaign.mockResolvedValue({ ...campaign, currentDay: null });
    fetchCampaignEvents.mockResolvedValue([]);

    render(await CampaignCalendarPage(routeProps()));

    expect(fetchWorldHistoryBetween).not.toHaveBeenCalled();
    expect(screen.getByTestId("list")).toHaveTextContent("0/0/null");
  });

  it("filters by one of the campaign's adventures", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(
      await CampaignCalendarPage(routeProps("dnd5e", { adventure: "10" }))
    );

    expect(fetchCampaignEvents).toHaveBeenCalledWith(1, 10);
    expect(screen.getByTestId("filters")).toHaveTextContent("10");
  });

  it("ignores an adventure that is not the campaign's", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(
      await CampaignCalendarPage(routeProps("dnd5e", { adventure: "99" }))
    );

    expect(fetchCampaignEvents).toHaveBeenCalledWith(1, null);
  });

  it("shows the month grid of today's month, reading only that month (T7)", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(await CampaignCalendarPage(routeProps("dnd5e", { view: "grid" })));

    // Day 400 is year 1, day 35 of it: February (days 396–423).
    expect(screen.getByTestId("grid")).toHaveTextContent("1-1/1/1/3");
    expect(screen.getByTestId("view-switch")).toHaveTextContent("grid");
    expect(screen.getByTestId("grid-navigation")).toHaveTextContent("400");
    expect(fetchCampaignEvents).toHaveBeenCalledWith(1, null, {
      firstDay: 396,
      lastDay: 423,
    });
    expect(fetchWorldHistoryBetween).toHaveBeenCalledWith(396, 423, true);
    expect(screen.queryByTestId("list")).not.toBeInTheDocument();
  });

  it("shows the month the URL names", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(
      await CampaignCalendarPage(
        routeProps("dnd5e", { view: "grid", year: "0", month: "12" })
      )
    );

    expect(screen.getByTestId("grid")).toHaveTextContent("0-11");
    expect(findEdgeEventDay).not.toHaveBeenCalled();
  });

  it("opens on the first event's month with no current day", async () => {
    fetchCampaign.mockResolvedValue({ ...campaign, currentDay: null });
    findEdgeEventDay.mockResolvedValue(40);

    render(
      await CampaignCalendarPage(
        routeProps("dnd5e", { view: "grid", adventure: "10" })
      )
    );

    expect(findEdgeEventDay).toHaveBeenCalledWith(
      { campaignId: 1, adventureId: 10 },
      "first"
    );
    expect(screen.getByTestId("grid")).toHaveTextContent("0-1");
  });

  it("is not found under an unknown system, without reading", async () => {
    await expect(CampaignCalendarPage(routeProps("foo"))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(fetchCampaign).not.toHaveBeenCalled();
  });
});
