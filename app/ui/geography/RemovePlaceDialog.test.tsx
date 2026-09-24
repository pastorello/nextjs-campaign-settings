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

import RemovePlaceDialog from "./RemovePlaceDialog";

describe("RemovePlaceDialog (SPEC-010 T3; externally controlled since the 2026-08-17 usability fix)", () => {
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
      <RemovePlaceDialog
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
      <RemovePlaceDialog
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

  it("shows the can't-be-undone line whenever it is open (TD-140)", () => {
    render(
      <RemovePlaceDialog
        placeId={5}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        isOpen
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    expect(screen.getByText("confirmDescription")).toBeInTheDocument();
  });

  it("fetches real counts for the place the moment it opens", async () => {
    render(
      <RemovePlaceDialog
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
      <RemovePlaceDialog
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
      <RemovePlaceDialog
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

    // The confirm button stays disabled until the impact has loaded, and a
    // click on it before then does nothing — waiting for the fetch call alone
    // raced its result on a slow CI runner (2026-09-19).
    await waitFor(() =>
      expect(screen.getByText("confirm").closest("button")).toBeEnabled()
    );
    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() => expect(deletePlace).toHaveBeenCalledWith(5));
    expect(onDeleted).toHaveBeenCalled();
    expect(notifySuccess).toHaveBeenCalledWith("success");
  });

  it("notifies and does not report the place gone when deletePlace fails", async () => {
    deletePlace.mockRejectedValue(new Error("conflict"));
    const onDeleted = vi.fn();
    render(
      <RemovePlaceDialog
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

    // The confirm button stays disabled until the impact has loaded, and a
    // click on it before then does nothing — waiting for the fetch call alone
    // raced its result on a slow CI runner (2026-09-19).
    await waitFor(() =>
      expect(screen.getByText("confirm").closest("button")).toBeEnabled()
    );
    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("errors.deleteFailed")
    );
    expect(onDeleted).not.toHaveBeenCalled();
  });
});

/**
 * SPEC-023 — the same dialog, asked as one question, when the caller has an
 * un-place to offer. The popover passes `onUnplace`; the map's own "delete
 * this map" entry does not, which is what the suite above still covers.
 */
describe("RemovePlaceDialog — one question, two outcomes (SPEC-023)", () => {
  // Its own reset: `vi.clearAllMocks` clears calls, not implementations, so
  // without this the last test of the suite above leaves `deletePlace`
  // rejecting for every test here.
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPlaceDeletionImpact.mockResolvedValue({
      placeCount: 28,
      npcCount: 43,
      deityCount: 2,
    });
    deletePlace.mockResolvedValue(undefined);
  });

  const renderWithChoice = (overrides: Partial<Record<string, unknown>> = {}) =>
    render(
      <RemovePlaceDialog
        placeId={5}
        placeTitle="Terra"
        parentTitle="Piani di Esistenza"
        isRoot={false}
        isOpen
        onClose={vi.fn()}
        onDeleted={vi.fn()}
        onUnplace={vi.fn()}
        {...overrides}
      />
    );

  const loaded = async () => {
    await waitFor(() => expect(fetchPlaceDeletionImpact).toHaveBeenCalled());
    await screen.findByRole("radio", { name: "outcomes.deleteLabel" });
  };

  it("asks which removal is meant rather than confirming a delete", async () => {
    renderWithChoice();
    await loaded();

    expect(screen.getByText("chooseTitle")).toBeInTheDocument();
    expect(screen.queryByText("confirmTitle")).not.toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "outcomes.unplaceLabel" })
    ).toBeInTheDocument();
  });

  it("names what each outcome costs before either is taken", async () => {
    renderWithChoice();
    await loaded();

    // The delete outcome: SPEC-010 rule 2/3, the counts this dialog has
    // always fetched.
    expect(screen.getByText("placesImpact")).toBeInTheDocument();
    expect(screen.getByText("npcsImpact")).toBeInTheDocument();
    expect(screen.getByText("deitiesImpact")).toBeInTheDocument();
    // The un-place outcome: the same figures, read the other way round.
    expect(screen.getByText("outcomes.unplaceKeeps")).toBeInTheDocument();
    expect(screen.getByText("outcomes.unplaceEntities")).toBeInTheDocument();
  });

  it("leaves the entity line out when nothing is assigned here", async () => {
    fetchPlaceDeletionImpact.mockResolvedValue({
      placeCount: 0,
      npcCount: 0,
      deityCount: 0,
    });
    renderWithChoice();
    await loaded();

    // §5's edge case: the counts still read zero rather than the question
    // being hidden — but "nobody loses a location" is only worth saying
    // where somebody could have.
    expect(screen.getByText("outcomes.unplaceKeeps")).toBeInTheDocument();
    expect(screen.queryByText("outcomes.unplaceEntities")).toBeNull();
    expect(screen.getByText("noImpact")).toBeInTheDocument();
  });

  it("cannot be confirmed until an outcome is chosen", async () => {
    renderWithChoice();
    await loaded();

    expect(screen.getByText("confirm").closest("button")).toBeDisabled();

    fireEvent.click(
      screen.getByRole("radio", { name: "outcomes.deleteLabel" })
    );

    expect(screen.getByText("confirm").closest("button")).toBeEnabled();
  });

  it("hands the un-place back to the caller instead of deleting", async () => {
    const onUnplace = vi.fn();
    const onClose = vi.fn();
    const onDeleted = vi.fn();
    renderWithChoice({ onUnplace, onClose, onDeleted });
    await loaded();

    fireEvent.click(
      screen.getByRole("radio", { name: "outcomes.unplaceLabel" })
    );
    fireEvent.click(screen.getByText("confirmUnplace"));

    expect(onUnplace).toHaveBeenCalledTimes(1);
    expect(deletePlace).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("deletes when the destructive outcome is the one chosen", async () => {
    const onUnplace = vi.fn();
    const onDeleted = vi.fn();
    renderWithChoice({ onUnplace, onDeleted });
    await loaded();

    fireEvent.click(
      screen.getByRole("radio", { name: "outcomes.deleteLabel" })
    );
    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() => expect(deletePlace).toHaveBeenCalledWith(5));
    expect(onDeleted).toHaveBeenCalled();
    expect(onUnplace).not.toHaveBeenCalled();
  });

  it("cancelling after choosing an outcome performs neither", async () => {
    const onUnplace = vi.fn();
    const onDeleted = vi.fn();
    renderWithChoice({ onUnplace, onDeleted });
    await loaded();

    fireEvent.click(
      screen.getByRole("radio", { name: "outcomes.deleteLabel" })
    );
    fireEvent.click(screen.getByText("cancel"));

    expect(deletePlace).not.toHaveBeenCalled();
    expect(onUnplace).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
