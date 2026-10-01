import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const fetchRootPlace = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/maps/fetchRootPlace", () => ({
  default: () => fetchRootPlace(),
}));

const countUnpositionedPlaces = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/maps/countUnpositionedPlaces", () => ({
  default: () => countUnpositionedPlaces(),
}));

const countBlockedUnpositionedPlaces = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/maps/countBlockedUnpositionedPlaces", () => ({
  default: () => countBlockedUnpositionedPlaces(),
}));

const fetchPlaceAncestryChain = vi.fn<(id: number) => unknown>();
vi.mock("@/app/lib/data/maps/fetchPlaceAncestryChain", () => ({
  default: (id: number) => fetchPlaceAncestryChain(id),
}));

vi.mock("@/app/modules/maps/lib/utils/toStackEntry", () => ({
  default: (place: { id: number; title: string }) => ({
    id: place.id,
    title: place.title,
  }),
}));

// SPEC-022 T7: who is reading, and what their campaign may see.
const getViewer = vi.fn<() => Promise<unknown>>();
vi.mock("@/app/lib/auth/getViewer", () => ({
  default: () => getViewer(),
}));
const getVisibilityScope = vi.fn<() => Promise<unknown>>();
vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: () => getVisibilityScope(),
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

vi.mock("@/app/ui/geography/GeographyExplorer", () => ({
  default: ({
    root,
    unpositionedCount,
    blockedUnpositionedCount,
    initialStack,
    readOnly,
  }: {
    root: { title: string };
    unpositionedCount: number;
    blockedUnpositionedCount?: number;
    initialStack?: { id: number; title: string }[];
    readOnly?: boolean;
  }) => (
    <div
      data-testid="geography-explorer"
      data-read-only={String(readOnly ?? false)}
      data-unpositioned={unpositionedCount}
      data-blocked-unpositioned={blockedUnpositionedCount}
      data-initial-stack={
        initialStack ? initialStack.map((entry) => entry.title).join(">") : ""
      }
    >
      {root.title}
    </div>
  ),
}));

import GeographyPage, { generateMetadata } from "./page";

beforeEach(() => {
  getViewer.mockResolvedValue({ kind: "dm", userId: "1" });
});

function pageProps(search: Record<string, string> = {}, system = "dnd5e") {
  return {
    params: Promise.resolve({ locale: "it", system }),
    searchParams: Promise.resolve(search),
  };
}

describe("dashboard geography Page (SPEC-004 M7)", () => {
  it("titles the page from the geography.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("offers the create-world prompt on an empty installation, not the explorer", async () => {
    fetchRootPlace.mockResolvedValue(null);

    render(
      await GeographyPage({
        params: Promise.resolve({ locale: "it", system: "dnd5e" }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.queryByTestId("geography-explorer")).not.toBeInTheDocument();
    expect(screen.getByText("noWorldYet")).toBeInTheDocument();
    expect(screen.getByText("createWorldLink")).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/world"
    );
    // No tree to count on an empty installation (SPEC-007 §5 edge cases).
    expect(countUnpositionedPlaces).not.toHaveBeenCalled();
    expect(countBlockedUnpositionedPlaces).not.toHaveBeenCalled();
  });

  it("renders the tree explorer once a root exists, with the unpositioned count", async () => {
    fetchRootPlace.mockResolvedValue({
      id: 1,
      title: "Aerivel",
      mapImage: "aerivel.png",
      mapBounds: null,
      mapInitialView: null,
      mapInitialZoom: null,
    });
    countUnpositionedPlaces.mockResolvedValue(42);
    // TD-79 — of the 42 above, how many are blocked on a parent's missing
    // map rather than simply not yet drawn.
    countBlockedUnpositionedPlaces.mockResolvedValue(5);

    render(
      await GeographyPage({
        params: Promise.resolve({ locale: "it", system: "dnd5e" }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByTestId("geography-explorer")).toHaveTextContent(
      "Aerivel"
    );
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-unpositioned",
      "42"
    );
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-blocked-unpositioned",
      "5"
    );
  });
});

describe("dashboard geography Page — ?place= landing (SPEC-011 T4)", () => {
  const root = {
    id: 1,
    title: "Aerivel",
    mapImage: "aerivel.png",
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
  };

  beforeEach(() => {
    fetchRootPlace.mockResolvedValue(root);
    countUnpositionedPlaces.mockResolvedValue(42);
    countBlockedUnpositionedPlaces.mockResolvedValue(0);
    fetchPlaceAncestryChain.mockReset();
  });

  it("passes no initial stack when ?place= is absent, preserving today's root-only behaviour", async () => {
    render(
      await GeographyPage({
        params: Promise.resolve({ locale: "it", system: "dnd5e" }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(fetchPlaceAncestryChain).not.toHaveBeenCalled();
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      ""
    );
  });

  it("resolves the ancestry chain and passes it as the initial stack when ?place= is a nested place", async () => {
    fetchPlaceAncestryChain.mockResolvedValue([
      { id: 1, title: "Aerivel" },
      { id: 2, title: "Kingdom of Kang" },
    ]);

    render(
      await GeographyPage({
        params: Promise.resolve({ locale: "it", system: "dnd5e" }),
        searchParams: Promise.resolve({ place: "2" }),
      })
    );

    expect(fetchPlaceAncestryChain).toHaveBeenCalledWith(2);
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      "Aerivel>Kingdom of Kang"
    );
  });

  it("falls back to root-only navigation when ?place= doesn't resolve to a real place", async () => {
    fetchPlaceAncestryChain.mockResolvedValue(null);

    render(
      await GeographyPage({
        params: Promise.resolve({ locale: "it", system: "dnd5e" }),
        searchParams: Promise.resolve({ place: "999" }),
      })
    );

    expect(fetchPlaceAncestryChain).toHaveBeenCalledWith(999);
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      ""
    );
  });

  it("falls back to root-only navigation on a garbage, non-numeric ?place= value, without querying", async () => {
    render(
      await GeographyPage({
        params: Promise.resolve({ locale: "it", system: "dnd5e" }),
        searchParams: Promise.resolve({ place: "not-a-number" }),
      })
    );

    expect(fetchPlaceAncestryChain).not.toHaveBeenCalled();
    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      ""
    );
  });
});

// SPEC-022 T7 (R8): a player's map shows what their campaign may see, read
// only, and nothing of the unpositioned pool.
describe("dashboard geography Page — a player (SPEC-022 T7)", () => {
  const root = {
    id: 1,
    title: "Aerivel",
    mapImage: "aerivel.png",
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
  };
  const campaign = { id: 7, title: "Rovine", system: "dnd5e" };
  const player = (current: unknown = campaign) => ({
    kind: "player",
    userId: "2",
    campaigns: current ? [current] : [],
    campaign: current,
  });
  const scope = (zones: number[]) => ({
    kind: "campaign",
    campaignId: campaign.id,
    zones: new Set(zones),
    pois: new Set(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    fetchRootPlace.mockResolvedValue(root);
    getViewer.mockResolvedValue(player());
    getVisibilityScope.mockResolvedValue(scope([1, 2]));
  });

  it("shows the read-only explorer from the root, without the unpositioned counts", async () => {
    render(await GeographyPage(pageProps()));

    const explorer = screen.getByTestId("geography-explorer");
    expect(explorer).toHaveTextContent("Aerivel");
    expect(explorer).toHaveAttribute("data-read-only", "true");
    expect(explorer).toHaveAttribute("data-unpositioned", "0");
    expect(countUnpositionedPlaces).not.toHaveBeenCalled();
    expect(countBlockedUnpositionedPlaces).not.toHaveBeenCalled();
  });

  it("lands on a visible place's map from a deep link", async () => {
    fetchPlaceAncestryChain.mockResolvedValue([
      { id: 1, title: "Aerivel" },
      { id: 2, title: "Kang" },
    ]);

    render(await GeographyPage(pageProps({ place: "2" })));

    expect(screen.getByTestId("geography-explorer")).toHaveAttribute(
      "data-initial-stack",
      "Aerivel>Kang"
    );
  });

  it("is a 404 for a deep link to a hidden place", async () => {
    fetchPlaceAncestryChain.mockResolvedValue([
      { id: 1, title: "Aerivel" },
      { id: 3, title: "Secret" },
    ]);

    await expect(GeographyPage(pageProps({ place: "3" }))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });

  it.each([
    ["a missing place", "999"],
    ["a garbage value", "not-a-number"],
  ])("is a 404 for a deep link to %s, like a hidden one", async (_, place) => {
    fetchPlaceAncestryChain.mockResolvedValue(null);

    await expect(GeographyPage(pageProps({ place }))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
  });

  it("says nothing is revealed yet when the root is hidden from the campaign", async () => {
    getVisibilityScope.mockResolvedValue(scope([]));

    render(await GeographyPage(pageProps()));

    expect(screen.getByText("player.nothingRevealed")).toBeInTheDocument();
    expect(screen.queryByTestId("geography-explorer")).not.toBeInTheDocument();
  });

  it("says the player is in no campaign yet, reading nothing", async () => {
    getViewer.mockResolvedValue(player(null));

    render(await GeographyPage(pageProps()));

    expect(screen.getByText("player.noCampaign")).toBeInTheDocument();
    expect(fetchRootPlace).not.toHaveBeenCalled();
  });

  it("is a 404 under a system that is not the campaign's", async () => {
    await expect(GeographyPage(pageProps({}, "daggerheart"))).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(fetchRootPlace).not.toHaveBeenCalled();
  });
});
