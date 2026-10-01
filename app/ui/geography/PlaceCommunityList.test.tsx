import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
const system = vi.hoisted(() => ({ current: "daggerheart" }));
vi.mock("@/app/lib/hooks/useGameSystem", () => ({
  default: () => system.current,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
const fetchCommunitiesAtPlace = vi.hoisted(() =>
  vi.fn<(zoneId: number) => Promise<unknown>>()
);
vi.mock("@/app/lib/data/dhCommunities/fetchCommunitiesAtPlace", () => ({
  default: (zoneId: number) => fetchCommunitiesAtPlace(zoneId),
}));

import PlaceCommunityList from "./PlaceCommunityList";

describe("PlaceCommunityList (SPEC-027 §5.6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    system.current = "daggerheart";
    fetchCommunitiesAtPlace.mockResolvedValue([{ id: 5, name: "Valefolk" }]);
  });

  it("lists a place's communities under daggerheart, as links to their cards", async () => {
    render(<PlaceCommunityList zoneId={3} />);

    expect(
      await screen.findByRole("link", { name: "Valefolk" })
    ).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/communities?query=Valefolk&view=cards"
    );
    expect(fetchCommunitiesAtPlace).toHaveBeenCalledWith(3);
  });

  it("reads and shows nothing under dnd5e", async () => {
    system.current = "dnd5e";

    const { container } = render(<PlaceCommunityList zoneId={3} />);
    await Promise.resolve();

    expect(container).toBeEmptyDOMElement();
    expect(fetchCommunitiesAtPlace).not.toHaveBeenCalled();
  });
});
