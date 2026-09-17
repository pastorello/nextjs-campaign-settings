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

import AdventurePage, { generateMetadata } from "./page";

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
    await expect(
      AdventurePage({ params: Promise.resolve({ adventureId: "abc" }) })
    ).rejects.toThrow();

    expect(notFound).toHaveBeenCalled();
    expect(fetchAdventureWithScenes).not.toHaveBeenCalled();
  });

  it("renders a 404 when the adventure does not exist", async () => {
    fetchAdventureWithScenes.mockResolvedValue(null);

    await expect(
      AdventurePage({ params: Promise.resolve({ adventureId: "999" }) })
    ).rejects.toThrow();

    expect(notFound).toHaveBeenCalled();
  });

  it("shows the adventure header, budget panel and scene list once found", async () => {
    fetchAdventureWithScenes.mockResolvedValue({
      id: 10,
      currencyUnit: "gold",
      scenes: [],
    });

    render(
      await AdventurePage({ params: Promise.resolve({ adventureId: "10" }) })
    );

    expect(getBudgetTotals).toHaveBeenCalledWith(10);
    expect(screen.getByTestId("adventure-header")).toBeInTheDocument();
    expect(screen.getByTestId("budget-panel")).toBeInTheDocument();
    expect(screen.getByTestId("scene-list")).toBeInTheDocument();
  });
});
