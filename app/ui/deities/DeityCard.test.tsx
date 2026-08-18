import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import DeityRank from "@/app/lib/definitions/enums/deities/DeityRank";
import Holidays from "@/app/lib/definitions/enums/deities/Holidays";
import TarotMeaning from "@/app/lib/definitions/enums/tarot/TarotMeaning";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Has its own suite (SPEC-008 T5, SPEC-007 T3) — stubbed here so this file
// stays about DeityCard's own rendering, not the assignment modal's flow.
vi.mock(
  "../buttons/AssignLocationButton",
  () =>
    ({
      default: (props: { currentLocationLabel: string }) => (
        <button data-testid="assign-location-trigger">
          {props.currentLocationLabel}
        </button>
      ),
    }) as never
);

import DeityCard from "./DeityCard";

const item: Deity = {
  id: 7,
  name: "Helios",
  deityTitle: "Il Sole",
  deityType: 1,
  deityRank: DeityRank.Divinità,
  tarotCard: 1,
  celestialBody: 1,
  element: 1,
  class: 1,
  holidays: "" as Holidays,
  color: 1,
  tradition: 1,
  alignment: 1,
  alignmentDomain: 1,
  meaning: "" as TarotMeaning,
};

describe("DeityCard", () => {
  it("shows the place and the plane above it, both derived from one pin", () => {
    render(
      <DeityCard
        cardItem={item}
        placement={{
          place: "Paradiso",
          plane: "Cieli",
          zoneId: 3,
          poiId: null,
        }}
      />
    );
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Paradiso, Cieli")).toBeInTheDocument();
  });

  it("shows the place alone when no plane sits above it", () => {
    render(
      <DeityCard
        cardItem={item}
        placement={{ place: "Paradiso", plane: null, zoneId: 3, poiId: null }}
      />
    );
    fireEvent.click(screen.getByRole("button"));

    // Not "Paradiso, " — the separator belongs between two values, and a
    // trailing comma is what naive string concatenation would produce.
    expect(screen.getByText("Paradiso")).toBeInTheDocument();
  });

  it("shows 'Sconosciuta' rather than nothing for a deity nobody has pinned yet (SPEC-007 T3)", () => {
    render(<DeityCard cardItem={item} />);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByTestId("assign-location-trigger")).toHaveTextContent(
      "common.location.unknown"
    );
  });

  it("rotates the chevron icon in a square box, not the wrapper itself (TD-90)", () => {
    render(<DeityCard cardItem={item} />);

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
