import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("@/app/ui/dashboard/cards", () => ({
  default: () => <div data-testid="card-wrapper" />,
}));

const getViewer = vi.fn<() => Promise<unknown>>();
vi.mock("@/app/lib/auth/getViewer", () => ({
  default: () => getViewer(),
}));
const redirect = vi.fn((..._args: unknown[]) => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("@/i18n/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import Page, { dynamic } from "./page";

function props(system = "dnd5e") {
  return {
    params: Promise.resolve({ locale: "it", system }),
    searchParams: Promise.resolve({}),
  };
}

const player = (campaign: unknown) => ({
  kind: "player",
  userId: "2",
  campaigns: campaign ? [campaign] : [],
  campaign,
});

describe("dashboard overview Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewer.mockResolvedValue({ kind: "dm", userId: "1" });
  });

  it("is force-dynamic, so the live counts are never build-time frozen", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders the title and the record-count cards", async () => {
    render(await Page(props()));

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByTestId("card-wrapper")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  // SPEC-022 T7: the counts are not a player's until T8 filters them.
  it("sends a player to their campaign's map, under its system", async () => {
    getViewer.mockResolvedValue(
      player({ id: 4, title: "Rovine", system: "daggerheart" })
    );

    await expect(Page(props("dnd5e"))).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith({
      href: "/dashboard/daggerheart/geography",
      locale: "it",
    });
  });

  it("sends a player with no campaign to the map page, which says so", async () => {
    getViewer.mockResolvedValue(player(null));

    await expect(Page(props("dnd5e"))).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith({
      href: "/dashboard/dnd5e/geography",
      locale: "it",
    });
  });
});
