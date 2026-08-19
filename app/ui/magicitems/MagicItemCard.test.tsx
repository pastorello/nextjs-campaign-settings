import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import MagicItemCard from "./MagicItemCard";

const item: MagicItem = {
  id: 1,
  name: "Sunblade",
  rarity: 1,
  type: 1,
  attuned: false,
  consumable: false,
  description: "<p>A blade of pure light.</p>",
};

describe("MagicItemCard", () => {
  it("shows the item name collapsed", () => {
    render(<MagicItemCard cardItem={item} />);

    expect(screen.getByText("Sunblade")).toBeInTheDocument();
  });

  it("rotates the chevron icon in a square box, not the wrapper itself (TD-90)", () => {
    render(<MagicItemCard cardItem={item} />);

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
