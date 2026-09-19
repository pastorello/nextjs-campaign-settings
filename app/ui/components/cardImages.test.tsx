import { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";
import DeityRank from "@/app/lib/definitions/enums/deities/DeityRank";
import Holidays from "@/app/lib/definitions/enums/deities/Holidays";
import TarotMeaning from "@/app/lib/definitions/enums/tarot/TarotMeaning";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
// Has its own suite; stubbed so this file stays about the images.
vi.mock(
  "../buttons/AssignLocationButton",
  () => ({ default: () => <button>assign</button> }) as never
);

import NpcCard from "../npc/NpcCard";
import DeityCard from "../deities/DeityCard";
import MagicItemCard from "../magicitems/MagicItemCard";
import TreasureCard from "../treasures/TreasureCard";
import FactionCard from "../factions/FactionCard";

const image: RecordImageKeys = {
  displayKey: "display-key.webp",
  thumbKey: "thumb-key.webp",
  width: 1600,
  height: 900,
};

/**
 * Every card with an image field (SPEC-020 T4), each given a name and,
 * optionally, image keys as the list fetch reads them.
 */
const cards: Array<[string, (img: RecordImageKeys | null) => ReactElement]> = [
  [
    "NpcCard",
    (img) => (
      <NpcCard
        cardItem={{
          id: 1,
          name: "Elminster",
          description: "",
          title: "",
          alignment: 1,
          alignmentDomain: 1,
          position: "",
          faction: null,
          appearance: "",
          personality: "",
          motivations: "",
          secrets: "",
          image: img,
        }}
      />
    ),
  ],
  [
    "DeityCard",
    (img) => (
      <DeityCard
        cardItem={{
          id: 1,
          name: "Elminster",
          deityTitle: "",
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
          image: img,
        }}
      />
    ),
  ],
  [
    "MagicItemCard",
    (img) => (
      <MagicItemCard
        cardItem={{
          id: 1,
          name: "Elminster",
          rarity: 1,
          type: 1,
          attuned: false,
          consumable: false,
          description: "",
          image: img,
        }}
      />
    ),
  ],
  [
    "TreasureCard",
    (img) => (
      <TreasureCard
        cardItem={{
          id: 1,
          name: "Elminster",
          description: null,
          category: 1,
          value: null,
          image: img,
        }}
      />
    ),
  ],
  [
    "FactionCard",
    (img) => (
      <FactionCard
        cardItem={{ id: 1, name: "Elminster", description: "", image: img }}
        roster={[]}
      />
    ),
  ],
];

describe.each(cards)("%s's image (SPEC-020 T4)", (_name, renderCard) => {
  it("shows the thumbnail collapsed, outside the toggle, named after the record", () => {
    render(renderCard(image));

    const thumb = screen.getByRole("img", { name: "Elminster" });
    expect(thumb).toHaveAttribute("src", "/api/record-images/thumb-key.webp");
    expect(thumb).toHaveAttribute("loading", "lazy");
    // Inside the disclosure button, its alt text would join the button's
    // accessible name — "Elminster Elminster …".
    expect(thumb.closest("button")).toBeNull();
  });

  it("shows the display version, at its stored size, once expanded", () => {
    render(renderCard(image));

    fireEvent.click(screen.getAllByRole("button", { expanded: false })[0]!);

    const display = screen
      .getAllByRole("img", { name: "Elminster" })
      .find(
        (img) =>
          img.getAttribute("src") === "/api/record-images/display-key.webp"
      );
    expect(display).toBeDefined();
    expect(display).toHaveAttribute("width", "1600");
    expect(display).toHaveAttribute("height", "900");
  });

  it("shows a placeholder and no image at all without one", () => {
    render(renderCard(null));
    fireEvent.click(screen.getAllByRole("button", { expanded: false })[0]!);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("record-thumbnail-placeholder")
    ).toBeInTheDocument();
  });
});
