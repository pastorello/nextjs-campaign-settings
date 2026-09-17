import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

const fetchAdventureWithScenes = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/fetchAdventureWithScenes", () => ({
  default: (...args: unknown[]) => fetchAdventureWithScenes(...args),
}));

const getBudgetTotals = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/getBudgetTotals", () => ({
  default: (...args: unknown[]) => getBudgetTotals(...args),
}));

const fetchFieldOptions = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/options/fetchFieldOptions", () => ({
  default: (...args: unknown[]) => fetchFieldOptions(...args),
}));

vi.mock("@/app/ui/campaigns/AdventureHeader", () => ({
  default: () => <div data-testid="adventure-header" />,
}));

vi.mock("@/app/ui/campaigns/BudgetPanel", () => ({
  default: () => <div data-testid="budget-panel" />,
}));

vi.mock("@/app/ui/campaigns/SceneList", () => ({
  default: () => <div data-testid="scene-list" />,
}));

const redirect = vi.fn((_args: unknown) => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("@/i18n/navigation", () => ({
  redirect: (args: unknown) => redirect(args),
}));

import AdventurePage, { generateMetadata } from "./page";

function routeProps(adventureId: string, system = "dnd5e") {
  return {
    params: Promise.resolve({ locale: "en", system, adventureId }),
    searchParams: Promise.resolve({}),
  };
}

describe("Adventure page (SPEC-013 T8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchFieldOptions.mockResolvedValue([]);
    getBudgetTotals.mockResolvedValue({
      xp: { assigned: 0, found: 0 },
      currency: { assigned: 0, found: 0 },
      permanentItems: { assigned: 0, found: 0 },
      consumables: { assigned: 0, found: 0 },
      heroPoints: 0,
    });
  });

  it("titles the page from the adventure.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("renders a 404 for a non-numeric adventure id", async () => {
    await expect(AdventurePage(routeProps("abc"))).rejects.toThrow();

    expect(notFound).toHaveBeenCalled();
    expect(fetchAdventureWithScenes).not.toHaveBeenCalled();
  });

  it("renders a 404 when the adventure does not exist", async () => {
    fetchAdventureWithScenes.mockResolvedValue(null);

    await expect(AdventurePage(routeProps("999"))).rejects.toThrow();

    expect(notFound).toHaveBeenCalled();
  });

  it("shows the adventure header, budget panel and scene list once found", async () => {
    fetchAdventureWithScenes.mockResolvedValue({
      id: 10,
      currencyUnit: "gold",
      scenes: [],
      campaignSystem: "dnd5e",
    });

    render(await AdventurePage(routeProps("10")));

    expect(getBudgetTotals).toHaveBeenCalledWith(10);
    expect(screen.getByTestId("adventure-header")).toBeInTheDocument();
    expect(screen.getByTestId("budget-panel")).toBeInTheDocument();
    expect(screen.getByTestId("scene-list")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  // SPEC-018 T3 — a campaign opens under its own system. Only `dnd5e` is in
  // `GAME_SYSTEMS` today, so the route below is a stand-in for "another
  // system's URL": the page compares the two slugs and nothing more.
  it("redirects to the campaign's own system, keeping the locale", async () => {
    fetchAdventureWithScenes.mockResolvedValue({
      id: 10,
      currencyUnit: null,
      scenes: [],
      campaignSystem: "dnd5e",
    });

    await expect(
      AdventurePage(routeProps("10", "daggerheart"))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith({
      href: "/dashboard/dnd5e/campaign/10",
      locale: "en",
    });
    expect(getBudgetTotals).not.toHaveBeenCalled();
  });

  it("opens a standalone adventure under any system", async () => {
    fetchAdventureWithScenes.mockResolvedValue({
      id: 10,
      currencyUnit: null,
      scenes: [],
      campaignSystem: null,
    });

    render(await AdventurePage(routeProps("10", "daggerheart")));

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByTestId("scene-list")).toBeInTheDocument();
  });
});
