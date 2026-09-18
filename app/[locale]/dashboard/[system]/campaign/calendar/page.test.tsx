import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { universalCountFixture as universal } from "@/app/lib/calendar/dateSystemFixtures";

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

vi.mock("@/app/ui/calendar/DateSystemToggle", () => ({ default: () => null }));
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
    // Day 10 is in year 0, today (day 400) in year 1: both whole years.
    expect(fetchWorldHistoryBetween).toHaveBeenCalledWith(0, 729);
    expect(fetchCampaignEvents).toHaveBeenCalledWith(1, null);
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

  it("is not found under an unknown system, without reading", async () => {
    await expect(CampaignCalendarPage(routeProps("foo"))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(fetchCampaign).not.toHaveBeenCalled();
  });
});
