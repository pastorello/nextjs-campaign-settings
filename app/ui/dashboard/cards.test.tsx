import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

const fetchCardData = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/fetchCardData", () => ({
  default: () => fetchCardData(),
}));

import CardWrapper, { Card } from "./cards";

describe("CardWrapper (TD-91)", () => {
  it("fetches and renders all six domain counts, including places and factions", async () => {
    fetchCardData.mockResolvedValue({
      numberOfmagicItems: 1,
      numberOfNpc: 2,
      numberOfSpells: 3,
      numberOfDeities: 4,
      numberOfPlaces: 5,
      numberOfFactions: 6,
    });

    render(await CardWrapper());

    expect(screen.getByText("magicItems")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("npc")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("spells")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("deities")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("places")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("factions")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
});

describe("Card (TD-92)", () => {
  it.each([
    ["magicitems", "/dashboard/magicitems"],
    ["npc", "/dashboard/npc"],
    ["spells", "/dashboard/spells"],
    ["deities", "/dashboard/deities"],
    ["places", "/dashboard/geography"],
    ["factions", "/dashboard/factions"],
  ] as const)(
    "links the %s card to its domain list page (%s)",
    (type, href) => {
      render(<Card title="a title" value={1} type={type} />);

      expect(screen.getByText("a title").closest("a")).toHaveAttribute(
        "href",
        href
      );
    }
  );
});
