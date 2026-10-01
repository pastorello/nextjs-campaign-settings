import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DhCommunity from "@/app/lib/definitions/interfaces/daggerheart/DhCommunity";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
const { search } = vi.hoisted(() => ({ search: { value: "" } }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
  usePathname: () => "/it/dashboard/daggerheart/communities",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/app/lib/hooks/useGameSystem", () => ({
  default: () => "daggerheart",
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import DhCommunityLibrary from "./DhCommunityLibrary";

// Invented content only (SPEC-018 §5).
const items: DhCommunity[] = [
  {
    id: 5,
    name: "Valefolk",
    description: null,
    adjectives: "patient, wry",
    communityFeatureName: "Long memory",
    communityFeatureText: "<p>Recall an old road.</p>",
    communityPlaceIds: [1],
    communityFactionIds: [2],
    places: [{ id: 1, name: "Aerivel" }],
    factions: [{ id: 2, name: "Lamplighters" }],
    origin: "homebrew",
    image: null,
  },
];

describe("DhCommunityLibrary (SPEC-027 T3)", () => {
  beforeEach(() => {
    search.value = "";
  });

  it("lists rows by default, with the feature and the places", () => {
    render(<DhCommunityLibrary items={items} />);

    const rows = screen.getByTestId("dh-community-rows");
    expect(within(rows).getByText("Valefolk")).toBeInTheDocument();
    expect(within(rows).getByText("Long memory")).toBeInTheDocument();
    expect(within(rows).getByText("Aerivel")).toBeInTheDocument();
  });

  it("lays a community out as a card, its places and factions as links into the world", () => {
    search.value = "view=cards";

    render(<DhCommunityLibrary items={items} />);

    const card = screen.getByRole("article", { name: "Valefolk" });
    expect(within(card).getByText("patient, wry")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Aerivel" })).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/geography?place=1"
    );
    expect(
      within(card).getByRole("link", { name: "Lamplighters" })
    ).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/factions?query=Lamplighters"
    );
    expect(within(card).getByText("Recall an old road.")).toBeInTheDocument();
  });
});
