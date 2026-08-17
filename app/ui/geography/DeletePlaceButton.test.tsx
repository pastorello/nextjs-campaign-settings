import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPlaceDeletionImpact, deletePlace } = vi.hoisted(() => ({
  fetchPlaceDeletionImpact: vi.fn(),
  deletePlace: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchPlaceDeletionImpact", () => ({
  default: fetchPlaceDeletionImpact,
}));
vi.mock("@/app/lib/data/maps/deletePlace", () => ({
  default: deletePlace,
}));

const { notifyError, notifySuccess } = vi.hoisted(() => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError,
  notifySuccess,
}));

import DeletePlaceButton from "./DeletePlaceButton";

describe("DeletePlaceButton (SPEC-010 T3; externally controlled since the 2026-08-17 usability fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPlaceDeletionImpact.mockResolvedValue({
      placeCount: 28,
      npcCount: 43,
      deityCount: 2,
    });
    deletePlace.mockResolvedValue(undefined);
  });

  it("is not rendered for the root, even when open", () => {
    const { container } = render(
      <DeletePlaceButton
        placeId={1}
        placeTitle="Universo"
        parentTitle=""
        isRoot={true}
        isOpen
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(fetchPlaceDeletionImpact).not.toHaveBeenCalled();
  });

  it("shows nothing when closed", () => {
    const { container } = render(
      <DeletePlaceButton
        placeId={5}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        isOpen={false}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(fetchPlaceDeletionImpact).not.toHaveBeenCalled();
  });

  it("fetches real counts for the place the moment it opens", async () => {
    render(
      <DeletePlaceButton
        placeId={5}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        isOpen
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(fetchPlaceDeletionImpact).toHaveBeenCalledWith(5)
    );
  });

  it("cancelling writes nothing", async () => {
    const onClose = vi.fn();
    const onDeleted = vi.fn();
    render(
      <DeletePlaceButton
        placeId={5}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        isOpen
        onClose={onClose}
        onDeleted={onDeleted}
      />
    );

    await waitFor(() => expect(fetchPlaceDeletionImpact).toHaveBeenCalled());

    fireEvent.click(screen.getByText("cancel"));

    expect(deletePlace).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("confirming calls deletePlace and reports the place gone", async () => {
    const onDeleted = vi.fn();
    render(
      <DeletePlaceButton
        placeId={5}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        isOpen
        onClose={vi.fn()}
        onDeleted={onDeleted}
      />
    );

    await waitFor(() => expect(fetchPlaceDeletionImpact).toHaveBeenCalled());

    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() => expect(deletePlace).toHaveBeenCalledWith(5));
    expect(onDeleted).toHaveBeenCalled();
    expect(notifySuccess).toHaveBeenCalledWith("success");
  });

  it("notifies and does not report the place gone when deletePlace fails", async () => {
    deletePlace.mockRejectedValue(new Error("conflict"));
    const onDeleted = vi.fn();
    render(
      <DeletePlaceButton
        placeId={5}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        isOpen
        onClose={vi.fn()}
        onDeleted={onDeleted}
      />
    );

    await waitFor(() => expect(fetchPlaceDeletionImpact).toHaveBeenCalled());

    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("errors.deleteFailed")
    );
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
