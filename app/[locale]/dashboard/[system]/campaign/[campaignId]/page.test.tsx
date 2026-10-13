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

const redirect = vi.fn((_args: unknown) => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  redirect: (args: unknown) => redirect(args),
}));

const fetchCampaign = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/fetchCampaignById", () => ({
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

vi.mock("@/app/ui/campaigns/CampaignHeader", () => ({
  default: () => <div data-testid="campaign-header" />,
}));

vi.mock("@/app/ui/campaigns/AdventureLadder", () => ({
  default: () => <div data-testid="adventure-ladder" />,
}));

// SPEC-022 T5: the campaign's group, below the ladder.
vi.mock("@/app/lib/data/campaigns/fetchCampaignPlayers", () => ({
  default: () => Promise.resolve({ members: [], candidates: [] }),
}));
vi.mock("@/app/ui/campaigns/CampaignPlayers", () => ({
  default: ({ campaignId }: { campaignId: number }) => (
    <div data-testid="campaign-players">{campaignId}</div>
  ),
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

function routeProps(system = "dnd5e", campaignId = "1") {
  return {
    params: Promise.resolve({ locale: "it", system, campaignId }),
    searchParams: Promise.resolve({}),
  };
}

const campaign = {
  id: 1,
  title: "The Silver Coast",
  synopsis: null,
  partySize: 5,
  currentDay: null,
  system: "dnd5e",
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

  it("is not found when no campaign has the id, reading no progress", async () => {
    fetchCampaign.mockResolvedValue(null);

    await expect(CampaignPage(routeProps("dnd5e", "99"))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );

    expect(fetchCampaign).toHaveBeenCalledWith(99);
    expect(fetchAdventureSceneProgress).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-3", "1.5"])(
    "is not found for the malformed id %s, without reading",
    async (campaignId) => {
      await expect(
        CampaignPage(routeProps("dnd5e", campaignId))
      ).rejects.toThrow("NEXT_NOT_FOUND");

      expect(fetchCampaign).not.toHaveBeenCalled();
    }
  );

  // SPEC-032 §5.2: the address names the campaign; the system follows it.
  it("redirects a campaign of another system to its own address, keeping the locale", async () => {
    fetchCampaign.mockResolvedValue({ ...campaign, system: "daggerheart" });

    await expect(CampaignPage(routeProps("dnd5e", "1"))).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(redirect).toHaveBeenCalledWith({
      href: "/dashboard/daggerheart/campaign/1",
      locale: "it",
    });
  });

  it("does not redirect a campaign opened under its own system", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(await CampaignPage(routeProps("dnd5e", "1")));

    expect(redirect).not.toHaveBeenCalled();
  });

  it("shows the campaign header and its adventure ladder once a campaign exists", async () => {
    fetchCampaign.mockResolvedValue(campaign);

    render(await CampaignPage(routeProps()));

    expect(screen.getByTestId("campaign-header")).toBeInTheDocument();
    expect(screen.getByTestId("adventure-ladder")).toBeInTheDocument();
    expect(fetchAdventureSceneProgress).toHaveBeenCalledWith([10, 11]);
    // SPEC-022 T5: the campaign's players, for this campaign.
    expect(screen.getByTestId("campaign-players")).toHaveTextContent(
      String(campaign.id)
    );
  });

  it("reads the campaign in the address, not the system's first", async () => {
    fetchCampaign.mockResolvedValue({ ...campaign, id: 2 });

    render(await CampaignPage(routeProps("dnd5e", "2")));

    expect(fetchCampaign).toHaveBeenCalledWith(2);
    expect(screen.getByTestId("campaign-players")).toHaveTextContent("2");
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
