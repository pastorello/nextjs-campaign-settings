import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Spell from "@/app/lib/definitions/interfaces/spells/Spell";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import SpellCard from "./SpellCard";

const item: Spell = {
  id: 1,
  name: "Fireball",
  level: 3,
  circle: [],
  classes: [],
  castingTime: "1 action",
  range: "150 feet",
  components: "V, S, M",
  duration: "Instantaneous",
  savingThrow: "Dexterity",
  ritual: false,
  concentration: false,
  description: "<p>A bright streak flashes.</p>",
  upcast: "",
};

describe("SpellCard", () => {
  it("shows the spell name collapsed", () => {
    render(<SpellCard cardItem={item} />);

    expect(screen.getByText("Fireball")).toBeInTheDocument();
  });

  it("rotates the chevron icon in a square box, not the wrapper itself (TD-90)", () => {
    render(<SpellCard cardItem={item} />);

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
