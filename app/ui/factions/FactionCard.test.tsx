import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Faction from "@/app/lib/definitions/interfaces/faction/Faction";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import FactionCard from "./FactionCard";

const item: Faction = {
  id: 1,
  name: "The Harpers",
  description: "<p>A network of spies and do-gooders.</p>",
};

describe("FactionCard", () => {
  it("shows the faction name collapsed", () => {
    render(<FactionCard cardItem={item} roster={[]} />);

    expect(screen.getByText("The Harpers")).toBeInTheDocument();
  });

  it("rotates the chevron icon in a square box, not the wrapper itself (TD-90)", () => {
    render(<FactionCard cardItem={item} roster={[]} />);

    const toggleButton = screen.getByRole("button");
    expect(toggleButton).toHaveClass("group");

    const icon = toggleButton.querySelector("svg");
    const box = icon?.parentElement;

    // The box is square and centred, not the old bare `w-[40px]` that took
    // its height from the icon and pivoted off-centre.
    expect(box).toHaveClass(
      "flex",
      "h-10",
      "w-10",
      "items-center",
      "justify-center"
    );
    expect(box).not.toHaveClass("w-[40px]");
    expect(box).not.toHaveClass("group-data-open:rotate-180");

    // The rotation (and the transition) belongs on the icon, not the box.
    expect(icon).toHaveClass(
      "group-data-open:rotate-180",
      "transition-transform"
    );
  });
});
