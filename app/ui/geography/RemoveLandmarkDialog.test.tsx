import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchLandmarkDeletionImpact } = vi.hoisted(() => ({
  fetchLandmarkDeletionImpact: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/fetchLandmarkDeletionImpact", () => ({
  default: fetchLandmarkDeletionImpact,
}));

const { notifyError } = vi.hoisted(() => ({ notifyError: vi.fn() }));
vi.mock("@/app/lib/notifications/notify", () => ({ notifyError }));

import RemoveLandmarkDialog from "./RemoveLandmarkDialog";

const renderDialog = (overrides: Partial<Record<string, unknown>> = {}) => {
  const props = {
    landmarkId: 7,
    landmarkTitle: "Faro di Kang",
    parentTitle: "Kang",
    isOpen: true,
    onClose: vi.fn(),
    onUnplace: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<RemoveLandmarkDialog {...props} />);
  return props;
};

// The question is asked once the counts are in, as `RemovePlaceDialog` does.
const loaded = () =>
  screen.findByRole("radio", { name: "outcomes.deleteLabel" });

/**
 * SPEC-023's one question, landmark half — the two popover entries T7 and
 * SPEC-017 T10 left side by side, and TD-140's bare confirmation, as one
 * dialog with two named outcomes.
 */
describe("RemoveLandmarkDialog (SPEC-023)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchLandmarkDeletionImpact.mockResolvedValue({
      npcCount: 0,
      deityCount: 0,
    });
  });

  it("shows nothing when closed, and counts nothing", () => {
    const { container } = render(
      <RemoveLandmarkDialog
        landmarkId={7}
        landmarkTitle="Faro di Kang"
        parentTitle="Kang"
        isOpen={false}
        onClose={vi.fn()}
        onUnplace={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(fetchLandmarkDeletionImpact).not.toHaveBeenCalled();
  });

  it("offers both outcomes by name, with neither chosen for the DM", async () => {
    renderDialog();
    const remove = await loaded();

    const unplace = screen.getByRole("radio", {
      name: "outcomes.unplaceLabel",
    });

    expect(unplace).not.toBeChecked();
    expect(remove).not.toBeChecked();
    expect(screen.getByText("confirm").closest("button")).toBeDisabled();
  });

  it("keeps the two outcomes exclusive — answering again replaces the answer", async () => {
    renderDialog();
    const remove = await loaded();
    const unplace = screen.getByRole("radio", {
      name: "outcomes.unplaceLabel",
    });

    fireEvent.click(remove);
    fireEvent.click(unplace);

    expect(unplace).toBeChecked();
    expect(remove).not.toBeChecked();
  });

  it("says what each outcome does before either is taken", async () => {
    renderDialog();
    await loaded();

    expect(screen.getByText("outcomes.unplaceSummary")).toBeInTheDocument();
    expect(screen.getByText("outcomes.deleteSummary")).toBeInTheDocument();
  });

  it("un-places, and does not delete, when that is the outcome chosen", async () => {
    const { onUnplace, onDelete, onClose } = renderDialog();
    await loaded();

    fireEvent.click(
      screen.getByRole("radio", { name: "outcomes.unplaceLabel" })
    );
    fireEvent.click(screen.getByText("confirmUnplace"));

    expect(onUnplace).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("deletes, and does not un-place, when that is the outcome chosen", async () => {
    const { onUnplace, onDelete, onClose } = renderDialog();
    fireEvent.click(await loaded());
    fireEvent.click(screen.getByText("confirm"));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onUnplace).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("performs neither outcome on cancel, and forgets the choice", async () => {
    const { onUnplace, onDelete } = renderDialog();
    fireEvent.click(await loaded());
    fireEvent.click(screen.getByText("cancel"));

    expect(onDelete).not.toHaveBeenCalled();
    expect(onUnplace).not.toHaveBeenCalled();
    // The caller controls `isOpen`, so the dialog is still mounted here —
    // a re-open must not arrive with the destructive outcome pre-armed.
    expect(
      screen.getByRole("radio", { name: "outcomes.deleteLabel" })
    ).not.toBeChecked();
    expect(screen.getByText("confirm").closest("button")).toBeDisabled();
  });

  // The counts TD-147 made honest: `deletePoi` detaches the landmark's
  // characters and leaves them in the enclosing place, so the dialog can
  // say how many, the way `RemovePlaceDialog` does for a place.
  describe("what the delete does to the characters attached (after TD-147)", () => {
    it("counts them for this landmark the moment it opens", async () => {
      renderDialog();

      await waitFor(() =>
        expect(fetchLandmarkDeletionImpact).toHaveBeenCalledWith(7)
      );
    });

    it("says the loading line, and offers nothing to confirm, until they arrive", () => {
      fetchLandmarkDeletionImpact.mockReturnValue(new Promise(() => {}));
      renderDialog();

      expect(screen.getByText("loading")).toBeInTheDocument();
      expect(
        screen.queryByRole("radio", { name: "outcomes.deleteLabel" })
      ).toBeNull();
      expect(screen.getByText("confirm").closest("button")).toBeDisabled();
    });

    it("names how many NPCs and deities stay in the enclosing place", async () => {
      fetchLandmarkDeletionImpact.mockResolvedValue({
        npcCount: 3,
        deityCount: 1,
      });
      renderDialog();
      await loaded();

      expect(screen.getByText("outcomes.deleteNpcs")).toBeInTheDocument();
      expect(screen.getByText("outcomes.deleteDeities")).toBeInTheDocument();
      expect(screen.queryByText("outcomes.deleteNoEntities")).toBeNull();
    });

    it("leaves out a line whose count is zero", async () => {
      fetchLandmarkDeletionImpact.mockResolvedValue({
        npcCount: 2,
        deityCount: 0,
      });
      renderDialog();
      await loaded();

      expect(screen.getByText("outcomes.deleteNpcs")).toBeInTheDocument();
      expect(screen.queryByText("outcomes.deleteDeities")).toBeNull();
    });

    it("says nobody is attached when nobody is", async () => {
      renderDialog();
      await loaded();

      expect(screen.getByText("outcomes.deleteNoEntities")).toBeInTheDocument();
      expect(screen.queryByText("outcomes.deleteNpcs")).toBeNull();
    });

    it("notifies and closes when the counts cannot be read", async () => {
      fetchLandmarkDeletionImpact.mockRejectedValue(new Error("down"));
      const { onClose, onDelete } = renderDialog();

      await waitFor(() =>
        expect(notifyError).toHaveBeenCalledWith("errors.loadImpactFailed")
      );
      expect(onClose).toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });
});
