import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import NpcCard from "./NpcCard";

const item: NpcItem = {
  id: 1,
  name: "Elminster",
  description: "<p>A meddling wizard.</p>",
  title: "The Sage of Shadowdale",
  alignment: 1,
  alignmentDomain: 1,
  position: "Advisor",
  location: 1,
  faction: 1,
  appearance: "An old man in grey robes",
  personality: "Wise and mischievous",
  motivations: "Protect the Realms",
  secrets: "",
};

describe("NpcCard", () => {
  it("shows name, title and position collapsed", () => {
    render(<NpcCard cardItem={item} />);

    expect(screen.getByText("Elminster")).toBeInTheDocument();
    expect(screen.getByText("The Sage of Shadowdale")).toBeInTheDocument();
    expect(screen.getByText("Advisor")).toBeInTheDocument();
  });

  it("shows the tree-derived place, not the stored location field", () => {
    render(
      <NpcCard
        cardItem={item}
        placement={{ place: "Skreebars", plane: "Terra" }}
      />
    );

    expect(screen.getByText("Skreebars")).toBeInTheDocument();
    // `item.location` is 1, whose label would be the first locationList
    // entry — the card must not be resolving that any more.
    expect(
      screen.queryByText("npc.locations.paradiso")
    ).not.toBeInTheDocument();
  });

  it("renders no place for an NPC nobody has pinned yet", () => {
    render(<NpcCard cardItem={item} />);

    expect(screen.queryByText("Skreebars")).not.toBeInTheDocument();
  });

  it("reveals personality and the description panel on expand", () => {
    render(<NpcCard cardItem={item} />);

    expect(screen.queryByText("Wise and mischievous")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Wise and mischievous")).toBeInTheDocument();
    expect(screen.getByText("A meddling wizard.")).toBeInTheDocument();
  });
});
