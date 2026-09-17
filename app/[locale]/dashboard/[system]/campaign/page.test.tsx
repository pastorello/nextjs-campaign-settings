import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const fetchCampaign = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/campaigns/fetchCampaign", () => ({
  default: () => fetchCampaign(),
}));

const fetchAdventureSceneProgress = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/fetchAdventureSceneProgress", () => ({
  default: (...args: unknown[]) => fetchAdventureSceneProgress(...args),
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

import CampaignPage, { generateMetadata } from "./page";

describe("Campaign page (SPEC-013 T7)", () => {
  it("titles the page from the campaign.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("offers the create-campaign form and nothing else on an empty installation", async () => {
    fetchCampaign.mockResolvedValue(null);

    render(await CampaignPage());

    expect(screen.getByTestId("campaign-form")).toBeInTheDocument();
    expect(screen.queryByTestId("adventure-ladder")).not.toBeInTheDocument();
    expect(fetchAdventureSceneProgress).not.toHaveBeenCalled();
  });

  it("shows the campaign header and its adventure ladder once a campaign exists", async () => {
    fetchCampaign.mockResolvedValue({
      id: 1,
      title: "The Silver Coast",
      synopsis: null,
      partySize: 5,
      adventures: [{ id: 10 }, { id: 11 }],
    });
    fetchAdventureSceneProgress.mockResolvedValue({});

    render(await CampaignPage());

    expect(screen.queryByTestId("campaign-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("campaign-header")).toBeInTheDocument();
    expect(screen.getByTestId("adventure-ladder")).toBeInTheDocument();
    expect(fetchAdventureSceneProgress).toHaveBeenCalledWith([10, 11]);
  });
});
