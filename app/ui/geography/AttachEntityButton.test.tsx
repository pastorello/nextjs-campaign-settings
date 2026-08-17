import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Never actually called — the modal itself is stubbed below — but
// statically imported for the ASSIGN_ACTIONS map; the real ones pull in
// `@/auth`, which isn't set up for this suite.
vi.mock("@/app/lib/data/npc/assignLocation", () => ({ default: vi.fn() }));
vi.mock("@/app/lib/data/deities/assignLocation", () => ({ default: vi.fn() }));

vi.mock("@/app/ui/components/AssignLocationModal", () => ({
  default: ({
    currentZoneId,
    currentLocationLabel,
    onAssigned,
  }: {
    currentZoneId: number | null;
    currentLocationLabel: string;
    onAssigned?: () => void;
  }) => (
    <div>
      modal:{currentZoneId}:{currentLocationLabel}
      <button onClick={() => onAssigned?.()}>simulate-assign</button>
    </div>
  ),
}));

const { fetchLinkableEntities } = vi.hoisted(() => ({
  fetchLinkableEntities: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchLinkableEntities", () => ({
  default: fetchLinkableEntities,
}));

import AttachEntityButton from "./AttachEntityButton";

describe("AttachEntityButton (usability fix, 2026-08-17: externally controlled)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchLinkableEntities.mockResolvedValue([{ id: 9, name: "Dexter" }]);
  });

  it("shows nothing when closed", () => {
    render(<AttachEntityButton zoneId={5} isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText("typePlaceholder")).not.toBeInTheDocument();
  });

  it("shows the picker when open", () => {
    render(<AttachEntityButton zoneId={5} isOpen onClose={vi.fn()} />);

    expect(screen.getByText("typePlaceholder")).toBeInTheDocument();
  });

  it("opens the modal for the chosen entity, pre-filled to the current zone", async () => {
    const onAttached = vi.fn();
    render(
      <AttachEntityButton
        zoneId={5}
        isOpen
        onClose={vi.fn()}
        onAttached={onAttached}
      />
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0]!, {
      target: { value: "npc" },
    });

    await waitFor(() =>
      expect(fetchLinkableEntities).toHaveBeenCalledWith("npc")
    );
    await screen.findByText("Dexter");

    fireEvent.change(screen.getAllByRole("combobox")[1]!, {
      target: { value: "9" },
    });

    expect(screen.getByText("modal:5:Dexter")).toBeInTheDocument();

    fireEvent.click(screen.getByText("simulate-assign"));
    expect(onAttached).toHaveBeenCalled();
  });

  it("cancelling the picker calls onClose without opening the modal", () => {
    const onClose = vi.fn();
    render(<AttachEntityButton zoneId={5} isOpen onClose={onClose} />);

    fireEvent.click(screen.getByText("cancel"));

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByText(/modal:/)).not.toBeInTheDocument();
  });
});
