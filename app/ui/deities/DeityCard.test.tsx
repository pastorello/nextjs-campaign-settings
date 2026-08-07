import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import DeityRank from "@/app/lib/definitions/enums/deities/DeityRank";
import Holidays from "@/app/lib/definitions/enums/deities/Holidays";
import TarotMeaning from "@/app/lib/definitions/enums/tarot/TarotMeaning";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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
  residence: 1,
  location: 1,
  meaning: "" as TarotMeaning,
};

describe("DeityCard", () => {
  it("shows the place and the plane above it, both derived from one pin", () => {
    render(
      <DeityCard
        cardItem={item}
        placement={{ place: "Paradiso", plane: "Cieli" }}
      />
    );
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Paradiso, Cieli")).toBeInTheDocument();
  });

  it("shows the place alone when no plane sits above it", () => {
    render(
      <DeityCard
        cardItem={item}
        placement={{ place: "Paradiso", plane: null }}
      />
    );
    fireEvent.click(screen.getByRole("button"));

    // Not "Paradiso, " — the separator belongs between two values, and a
    // trailing comma is what naive string concatenation would produce.
    expect(screen.getByText("Paradiso")).toBeInTheDocument();
  });

  it("shows nothing for a deity nobody has pinned yet", () => {
    render(<DeityCard cardItem={item} />);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.queryByText(/Paradiso/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cieli/)).not.toBeInTheDocument();
  });
});
