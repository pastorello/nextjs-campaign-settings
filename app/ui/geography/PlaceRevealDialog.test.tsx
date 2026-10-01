import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchPlaceReveals: vi.fn(),
  setPlaceReveal: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));
vi.mock("@/app/lib/data/visibility/fetchPlaceReveals", () => ({
  default: mocks.fetchPlaceReveals,
}));
vi.mock("@/app/lib/data/visibility/setPlaceReveal", () => ({
  default: mocks.setPlaceReveal,
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: mocks.notifySuccess,
  notifyError: mocks.notifyError,
}));

import PlaceRevealDialog from "./PlaceRevealDialog";

function renderDialog(isOpen = true) {
  return render(
    <PlaceRevealDialog
      kind="zone"
      placeId={3}
      title="City"
      isOpen={isOpen}
      onClose={vi.fn()}
    />
  );
}

describe("PlaceRevealDialog (SPEC-022 T6b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setPlaceReveal.mockResolvedValue({ ok: true });
    mocks.fetchPlaceReveals.mockResolvedValue({
      campaigns: [
        { id: 1, title: "Ashes", revealed: true, hiddenBy: null },
        { id: 2, title: "Embers", revealed: true, hiddenBy: "Kingdom" },
        { id: 3, title: "Cinders", revealed: false, hiddenBy: "Kingdom" },
      ],
    });
  });

  it("reads the place's reveals when it opens, not before", async () => {
    const { rerender } = renderDialog(false);
    expect(mocks.fetchPlaceReveals).not.toHaveBeenCalled();

    rerender(
      <PlaceRevealDialog
        kind="zone"
        placeId={3}
        title="City"
        isOpen
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByLabelText("Ashes")).toBeChecked();
    expect(mocks.fetchPlaceReveals).toHaveBeenCalledWith({
      kind: "zone",
      id: 3,
    });
  });

  it("names the ancestor that still hides a revealed place", async () => {
    renderDialog();

    await screen.findByLabelText("Embers");
    // Only where the place is revealed: for Cinders it is hidden anyway.
    expect(screen.getAllByText("hiddenBy")).toHaveLength(1);
  });

  it("reveals on a tick, then reads the hints again", async () => {
    renderDialog();

    fireEvent.click(await screen.findByLabelText("Cinders"));

    await waitFor(() =>
      expect(mocks.setPlaceReveal).toHaveBeenCalledWith({
        kind: "zone",
        id: 3,
        campaignId: 3,
        revealed: true,
      })
    );
    expect(mocks.notifySuccess).toHaveBeenCalledWith("revealed");
    await waitFor(() =>
      expect(mocks.fetchPlaceReveals).toHaveBeenCalledTimes(2)
    );
  });

  it("hides on an untick, and toasts a refusal", async () => {
    mocks.setPlaceReveal.mockResolvedValue({
      ok: false,
      errors: { campaignId: [{ key: "campaignNotFound" }] },
    });
    renderDialog();

    fireEvent.click(await screen.findByLabelText("Ashes"));

    await waitFor(() =>
      expect(mocks.notifyError).toHaveBeenCalledWith(
        "common.fieldErrors.campaignNotFound"
      )
    );
    expect(mocks.setPlaceReveal).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: 1, revealed: false })
    );
  });

  it("says when there is no campaign to reveal to", async () => {
    mocks.fetchPlaceReveals.mockResolvedValue({ campaigns: [] });
    renderDialog();

    expect(await screen.findByText("empty")).toBeInTheDocument();
  });
});
