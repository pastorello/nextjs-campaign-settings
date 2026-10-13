import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const fetchCampaigns = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/fetchCampaigns", () => ({
  default: (...args: unknown[]) => fetchCampaigns(...args),
}));

const fetchArchivedCampaigns = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/fetchArchivedCampaigns", () => ({
  default: (...args: unknown[]) => fetchArchivedCampaigns(...args),
}));
vi.mock("@/app/ui/campaigns/ArchivedCampaigns", () => ({
  default: ({ campaigns }: { campaigns: { id: number }[] }) => (
    <div data-testid="archived-campaigns">{campaigns.length}</div>
  ),
}));

vi.mock("@/app/ui/campaigns/CampaignForm", () => ({
  default: () => <div data-testid="campaign-form" />,
}));

vi.mock("@/app/ui/campaigns/CampaignList", () => ({
  default: ({ campaigns }: { campaigns: { id: number }[] }) => (
    <ul data-testid="campaign-list">
      {campaigns.map(({ id }) => (
        <li key={id}>{id}</li>
      ))}
    </ul>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import CampaignListPage, { generateMetadata } from "./page";

function routeProps(system = "dnd5e") {
  return {
    params: Promise.resolve({ locale: "it", system }),
    searchParams: Promise.resolve({}),
  };
}

describe("Campaign list page (SPEC-032 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchArchivedCampaigns.mockResolvedValue([]);
  });

  it("titles the page from the campaign.page catalogue", async () => {
    expect((await generateMetadata()).title).toBe("title");
  });

  it("shows the empty-state sentence and the create form with no campaign", async () => {
    fetchCampaigns.mockResolvedValue([]);

    render(await CampaignListPage(routeProps()));

    expect(screen.getByText("emptyState.description")).toBeInTheDocument();
    expect(screen.queryByTestId("campaign-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("campaign-form")).toBeInTheDocument();
  });

  it("lists every campaign, and still offers the form", async () => {
    fetchCampaigns.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    render(await CampaignListPage(routeProps()));

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByTestId("campaign-form")).toBeInTheDocument();
  });

  it("does not open a lone campaign on its own", async () => {
    fetchCampaigns.mockResolvedValue([{ id: 1 }]);

    render(await CampaignListPage(routeProps()));

    expect(screen.getByTestId("campaign-list")).toBeInTheDocument();
  });

  it("reads only the route system's campaigns, archived ones apart (T4)", async () => {
    fetchCampaigns.mockResolvedValue([]);
    fetchArchivedCampaigns.mockResolvedValue([{ id: 7 }]);

    render(await CampaignListPage(routeProps("daggerheart")));

    expect(fetchCampaigns).toHaveBeenCalledWith("daggerheart");
    expect(fetchArchivedCampaigns).toHaveBeenCalledWith("daggerheart");
    expect(screen.getByTestId("archived-campaigns")).toHaveTextContent("1");
    // The archived one is not a card.
    expect(screen.queryByTestId("campaign-list")).not.toBeInTheDocument();
  });

  it("is not found under an unknown system, without reading", async () => {
    await expect(CampaignListPage(routeProps("foo"))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );

    expect(fetchCampaigns).not.toHaveBeenCalled();
  });
});
