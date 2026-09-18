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

const fetchAdventureSceneProgress = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/fetchAdventureSceneProgress", () => ({
  default: (...args: unknown[]) => fetchAdventureSceneProgress(...args),
}));

const fetchCampaignEvents = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/fetchCampaignEvents", () => ({
  default: (...args: unknown[]) => fetchCampaignEvents(...args),
}));

vi.mock("@/app/lib/data/calendar/fetchDateSystems", () => ({
  default: () => Promise.resolve([universal]),
}));

vi.mock("@/app/lib/data/calendar/readDisplayDateSystemId", () => ({
  default: () => Promise.resolve(null),
}));

vi.mock("@/app/ui/campaigns/CampaignForm", () => ({
  default: () => <div data-testid="campaign-form" />,
}));

vi.mock("@/app/ui/campaigns/CampaignHeader", () => ({
  default: () => <div data-testid="campaign-header" />,
}));

vi.mock("@/app/ui/campaigns/AdventureLadder", () => ({
  default: () => <div data-testid="adventure-ladder" />,
}));

vi.mock("@/app/ui/calendar/UpcomingEvents", () => ({
  default: ({
    upcoming,
  }: {
    upcoming: { event: { title: string }; startDay: number }[];
  }) => (
    <ul data-testid="upcoming-events">
      {upcoming.map(({ event, startDay }) => (
        <li key={event.title}>{`${event.title}@${startDay}`}</li>
      ))}
    </ul>
  ),
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

import CampaignPage, { generateMetadata } from "./page";

function routeProps(system = "dnd5e") {
  return {
    params: Promise.resolve({ locale: "it", system }),
    searchParams: Promise.resolve({}),
  };
}

const campaign = {
  id: 1,
  title: "The Silver Coast",
  synopsis: null,
  partySize: 5,
  currentDay: null,
  adventures: [{ id: 10 }, { id: 11 }],
};

const event = (id: number, startDay: number, repeatsYearly = false) => ({
  id,
  title: `Event ${id}`,
  description: null,
  startDay,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly,
  adventure: null,
  scene: null,
});

describe("Campaign page (SPEC-013 T7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdventureSceneProgress.mockResolvedValue({});
  });

  it("titles the page from the campaign.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("offers the create-campaign form and nothing else on an empty installation", async () => {
    fetchCampaign.mockResolvedValue(null);

    render(await CampaignPage(routeProps()));

    expect(screen.getByTestId("campaign-form")).toBeInTheDocument();
    expect(screen.queryByTestId("adventure-ladder")).not.toBeInTheDocument();
    expect(fetchAdventureSceneProgress).not.toHaveBeenCalled();
  });

  it("shows the campaign header and its adventure ladder once a campaign exists", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(await CampaignPage(routeProps()));

    expect(screen.queryByTestId("campaign-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("campaign-header")).toBeInTheDocument();
    expect(screen.getByTestId("adventure-ladder")).toBeInTheDocument();
    expect(fetchAdventureSceneProgress).toHaveBeenCalledWith([10, 11]);
  });

  // SPEC-018 T3: the list is filtered by the URL's system.
  it("reads only the route system's campaign", async () => {
    fetchCampaign.mockResolvedValue(null);

    render(await CampaignPage(routeProps("dnd5e")));

    expect(fetchCampaign).toHaveBeenCalledWith("dnd5e");
  });

  it("is not found under an unknown system, without reading", async () => {
    await expect(CampaignPage(routeProps("foo"))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );

    expect(fetchCampaign).not.toHaveBeenCalled();
  });
});

describe("Campaign page — calendar (SPEC-014 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdventureSceneProgress.mockResolvedValue({});
  });

  it("links to the campaign calendar", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(await CampaignPage(routeProps()));

    expect(
      screen.getByRole("link", { name: "calendar.campaign.link" })
    ).toHaveAttribute("href", "/dashboard/dnd5e/campaign/calendar");
  });

  it("shows no upcoming events, and reads no calendar, without a current day", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(await CampaignPage(routeProps()));

    expect(screen.queryByTestId("upcoming-events")).not.toBeInTheDocument();
    expect(fetchCampaignEvents).not.toHaveBeenCalled();
  });

  it("shows the next three events after the current day, a yearly one by its next date", async () => {
    fetchCampaign.mockResolvedValue({ ...campaign, currentDay: 400 });
    fetchCampaignEvents.mockResolvedValue([
      event(1, 100), // past
      event(2, 30, true), // yearly: next on day 30 + 2·365 = 760
      event(3, 500),
      event(4, 410),
      event(5, 900),
    ]);

    render(await CampaignPage(routeProps()));

    expect(fetchCampaignEvents).toHaveBeenCalledWith(1);
    const items = screen.getByTestId("upcoming-events").querySelectorAll("li");
    expect([...items].map((item) => item.textContent)).toEqual([
      "Event 4@410",
      "Event 3@500",
      "Event 2@760",
    ]);
  });
});
