import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

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

import PlaceCatalogueList from "./PlaceCatalogueList";

const load =
  vi.fn<(zoneId: number) => Promise<{ id: number; name: string }[]>>();

describe("PlaceCatalogueList (SPEC-027 §5.6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    system.current = "daggerheart";
    load.mockResolvedValue([{ id: 5, name: "Valefolk" }]);
  });

  it("lists a place's records under their system, as links to their cards", async () => {
    render(
      <PlaceCatalogueList
        zoneId={3}
        page={PageType.DhCommunity}
        load={load}
        titleKey="dhCommunities.world.title"
      />
    );

    expect(
      await screen.findByRole("link", { name: "Valefolk" })
    ).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/communities?query=Valefolk&view=cards"
    );
    expect(
      screen.getByRole("heading", { name: "dhCommunities.world.title" })
    ).toBeInTheDocument();
    expect(load).toHaveBeenCalledWith(3);
  });

  it("reads and shows nothing under another system", async () => {
    system.current = "dnd5e";

    const { container } = render(
      <PlaceCatalogueList
        zoneId={3}
        page={PageType.DhCommunity}
        load={load}
        titleKey="dhCommunities.world.title"
      />
    );
    await Promise.resolve();

    expect(container).toBeEmptyDOMElement();
    expect(load).not.toHaveBeenCalled();
  });

  it("shows nothing for a place with none", async () => {
    load.mockResolvedValue([]);

    const { container } = render(
      <PlaceCatalogueList
        zoneId={3}
        page={PageType.DhCommunity}
        load={load}
        titleKey="dhCommunities.world.title"
      />
    );
    await Promise.resolve();

    expect(container).toBeEmptyDOMElement();
  });
});
