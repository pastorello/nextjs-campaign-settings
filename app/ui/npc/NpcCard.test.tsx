import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Has its own suite (SPEC-008 T5, SPEC-007 T3) — stubbed here so this file
// stays about NpcCard's own rendering, not the assignment modal's flow.
vi.mock(
  "../buttons/AssignLocationButton",
  () =>
    ({
      default: (props: {
        currentLocationLabel: string;
        currentZoneId: number | null;
        currentPoiId: number | null;
      }) => (
        <button
          data-testid="assign-location-trigger"
          data-zone-id={props.currentZoneId ?? undefined}
          data-poi-id={props.currentPoiId ?? undefined}
        >
          {props.currentLocationLabel}
        </button>
      ),
    }) as never
);

import NpcCard from "./NpcCard";

const item: NpcItem = {
  id: 1,
  name: "Elminster",
  description: "<p>A meddling wizard.</p>",
  title: "The Sage of Shadowdale",
  alignment: 1,
  alignmentDomain: 1,
  position: "Advisor",
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

  it("shows the tree-derived place, and the ids the modal needs to reassign it", () => {
    render(
      <NpcCard
        cardItem={item}
        placement={{
          place: "Skreebars",
          plane: "Terra",
          zoneId: 6,
          poiId: null,
        }}
      />
    );

    const trigger = screen.getByTestId("assign-location-trigger");
    expect(trigger).toHaveTextContent("Skreebars");
    expect(trigger).toHaveAttribute("data-zone-id", "6");
  });

  it("shows 'Sconosciuta' rather than nothing for an NPC nobody has pinned yet (SPEC-007 T3)", () => {
    render(<NpcCard cardItem={item} />);

    expect(screen.getByTestId("assign-location-trigger")).toHaveTextContent(
      "common.location.unknown"
    );
  });

  it("reveals personality and the description panel on expand", () => {
    render(<NpcCard cardItem={item} />);

    expect(screen.queryByText("Wise and mischievous")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Elminster"));

    expect(screen.getByText("Wise and mischievous")).toBeInTheDocument();
    expect(screen.getByText("A meddling wizard.")).toBeInTheDocument();
  });
});
