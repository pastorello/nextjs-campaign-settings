import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RemoveLandmarkDialog from "./RemoveLandmarkDialog";

const renderDialog = (overrides: Partial<Record<string, unknown>> = {}) => {
  const props = {
    landmarkTitle: "Faro di Kang",
    isOpen: true,
    onClose: vi.fn(),
    onUnplace: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<RemoveLandmarkDialog {...props} />);
  return props;
};

/**
 * SPEC-023's one question, landmark half — the two popover entries T7 and
 * SPEC-017 T10 left side by side, and TD-140's bare confirmation, as one
 * dialog with two named outcomes.
 */
describe("RemoveLandmarkDialog (SPEC-023)", () => {
  it("shows nothing when closed", () => {
    const { container } = render(
      <RemoveLandmarkDialog
        landmarkTitle="Faro di Kang"
        isOpen={false}
        onClose={vi.fn()}
        onUnplace={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("offers both outcomes by name, with neither chosen for the DM", () => {
    renderDialog();

    const unplace = screen.getByRole("radio", {
      name: "outcomes.unplaceLabel",
    });
    const remove = screen.getByRole("radio", { name: "outcomes.deleteLabel" });

    expect(unplace).not.toBeChecked();
    expect(remove).not.toBeChecked();
    expect(screen.getByText("confirm").closest("button")).toBeDisabled();
  });

  it("keeps the two outcomes exclusive — answering again replaces the answer", () => {
    renderDialog();
    const unplace = screen.getByRole("radio", {
      name: "outcomes.unplaceLabel",
    });
    const remove = screen.getByRole("radio", { name: "outcomes.deleteLabel" });

    fireEvent.click(remove);
    fireEvent.click(unplace);

    expect(unplace).toBeChecked();
    expect(remove).not.toBeChecked();
  });

  it("says what each outcome does before either is taken", () => {
    renderDialog();

    expect(screen.getByText("outcomes.unplaceSummary")).toBeInTheDocument();
    expect(screen.getByText("outcomes.deleteSummary")).toBeInTheDocument();
  });

  it("un-places, and does not delete, when that is the outcome chosen", () => {
    const { onUnplace, onDelete, onClose } = renderDialog();

    fireEvent.click(
      screen.getByRole("radio", { name: "outcomes.unplaceLabel" })
    );
    fireEvent.click(screen.getByText("confirmUnplace"));

    expect(onUnplace).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("deletes, and does not un-place, when that is the outcome chosen", () => {
    const { onUnplace, onDelete, onClose } = renderDialog();

    fireEvent.click(
      screen.getByRole("radio", { name: "outcomes.deleteLabel" })
    );
    fireEvent.click(screen.getByText("confirm"));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onUnplace).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("performs neither outcome on cancel, and forgets the choice", () => {
    const { onUnplace, onDelete } = renderDialog();

    fireEvent.click(
      screen.getByRole("radio", { name: "outcomes.deleteLabel" })
    );
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
});
