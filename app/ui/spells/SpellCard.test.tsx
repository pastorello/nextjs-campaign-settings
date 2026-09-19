import { fireEvent, render, screen } from "@testing-library/react";
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

  describe("description (SPEC-019 T5)", () => {
    const open = (description: string) => {
      const { container } = render(
        <SpellCard cardItem={{ ...item, description }} />
      );
      fireEvent.click(screen.getByRole("button"));
      return container;
    };

    it("renders formatted text as formatting", () => {
      open("<p>A <strong>bright</strong> streak.</p>");

      expect(screen.getByText("bright").tagName).toBe("STRONG");
    });

    it("never injects stored markup: the card no longer uses innerHTML", () => {
      const container = open(
        '<p>Boom<img src="x" onerror="alert(1)"><script>alert(2)</script></p>'
      );

      expect(screen.getByText("Boom")).toBeInTheDocument();
      expect(container.querySelector("img, script")).toBeNull();
    });

    it("shows legacy plain text literally, markup-looking text included", () => {
      open("Deals <b>8d6</b> fire damage");

      expect(
        screen.getByText("Deals <b>8d6</b> fire damage")
      ).toBeInTheDocument();
    });
  });
});
