import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

// Never actually called (the modal itself is stubbed below), but statically
// imported by AssignLocationButton for its ASSIGN_ACTIONS map — real ones
// pull in `@/auth`, which isn't set up for this suite.
vi.mock("@/app/lib/data/npc/assignLocation", () => ({ default: vi.fn() }));
vi.mock("@/app/lib/data/deities/assignLocation", () => ({
  default: vi.fn(),
}));

vi.mock("@/app/ui/components/AssignLocationModal", () => ({
  default: ({
    isOpen,
    currentLocationLabel,
    onAssigned,
  }: {
    isOpen: boolean;
    currentLocationLabel: string;
    onAssigned?: () => void;
  }) =>
    isOpen ? (
      <div>
        modal:{currentLocationLabel}
        <button onClick={() => onAssigned?.()}>simulate-assign</button>
      </div>
    ) : null,
}));

import AssignLocationButton from "./AssignLocationButton";
import PageType from "@/app/lib/definitions/types/PageType";

describe("AssignLocationButton", () => {
  it("does not render the modal before the button is clicked", () => {
    render(
      <AssignLocationButton
        pageType={PageType.Npc}
        entityId={1}
        currentZoneId={null}
        currentPoiId={null}
        currentLocationLabel="Sconosciuta"
      />
    );

    expect(screen.queryByText(/modal:/)).not.toBeInTheDocument();
  });

  it("opens the modal with the entity's current location", () => {
    render(
      <AssignLocationButton
        pageType={PageType.Deity}
        entityId={7}
        currentZoneId={5}
        currentPoiId={null}
        currentLocationLabel="Skreebars"
      />
    );

    fireEvent.click(screen.getByText("assignLocation"));

    expect(screen.getByText("modal:Skreebars")).toBeInTheDocument();
  });

  it("refreshes the page once a location is assigned", () => {
    render(
      <AssignLocationButton
        pageType={PageType.Npc}
        entityId={1}
        currentZoneId={null}
        currentPoiId={null}
        currentLocationLabel="Sconosciuta"
      />
    );

    fireEvent.click(screen.getByText("assignLocation"));
    fireEvent.click(screen.getByText("simulate-assign"));

    expect(refresh).toHaveBeenCalled();
  });
});
