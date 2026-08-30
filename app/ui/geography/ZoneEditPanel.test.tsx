import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateZoneDetails } = vi.hoisted(() => ({
  updateZoneDetails: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/updateZoneDetails", () => ({
  default: updateZoneDetails,
}));

const { notifyError, notifySuccess } = vi.hoisted(() => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError,
  notifySuccess,
}));

import ZoneEditPanel from "./ZoneEditPanel";

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof ZoneEditPanel>> = {}
) {
  const props = {
    placeId: 7,
    isOpen: true,
    onClose: vi.fn(),
    title: "Kang",
    description: "The eastern march.",
    hasFootprint: true,
    onSaved: vi.fn(),
    onRedrawArea: vi.fn(),
    ...overrides,
  };
  render(<ZoneEditPanel {...props} />);
  return props;
}

// `t(meta.labelKey)` passes the whole dotted path, so the key comes back
// whole. `tPanel("save")` does not: vitest.setup.ts's next-intl mock ignores
// the namespace and echoes only the argument, so panel copy is asserted by
// its bare key.
const nameLabel = "geography.fields.title.label";
const notesLabel = "geography.fields.description.label";

/** Enter submits this form in a browser; jsdom does not emulate that. */
function submitForm() {
  fireEvent.submit(screen.getByLabelText(nameLabel).closest("form")!);
}

describe("ZoneEditPanel (TD-104)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateZoneDetails.mockResolvedValue({ ok: true });
  });

  it("shows nothing when closed", () => {
    renderPanel({ isOpen: false });

    expect(screen.queryByLabelText(nameLabel)).not.toBeInTheDocument();
  });

  it("seeds both fields from the stored values", () => {
    renderPanel();

    expect(screen.getByLabelText(nameLabel)).toHaveValue("Kang");
    expect(screen.getByLabelText(notesLabel)).toHaveValue("The eastern march.");
  });

  it("seeds an empty box from a place with no description", () => {
    renderPanel({ description: null });

    expect(screen.getByLabelText(notesLabel)).toHaveValue("");
  });

  // The regression this item exists for: a region was not renamable
  // anywhere in the application before TD-104.
  it("renames the place", async () => {
    const { onSaved, onClose } = renderPanel();

    fireEvent.change(screen.getByLabelText(nameLabel), {
      target: { value: "Kang Reach" },
    });
    submitForm();

    await waitFor(() =>
      expect(updateZoneDetails).toHaveBeenCalledWith({
        id: 7,
        title: "Kang Reach",
        description: "The eastern march.",
      })
    );
    expect(onSaved).toHaveBeenCalledWith("Kang Reach", "The eastern march.");
    expect(notifySuccess).toHaveBeenCalledWith("success");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  // `""` and `null` would otherwise be two ways of saying the same thing;
  // `zoneMeta.description` refuses the empty string so that this
  // normalisation is the only path to a cleared column.
  it("sends null, not an empty string, for a cleared description", async () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText(notesLabel), {
      target: { value: "   " },
    });
    submitForm();

    await waitFor(() =>
      expect(updateZoneDetails).toHaveBeenCalledWith({
        id: 7,
        title: "Kang",
        description: null,
      })
    );
  });

  it("renders the mutation's field errors and stays open", async () => {
    updateZoneDetails.mockResolvedValue({
      ok: false,
      errors: { title: ["Too short"] },
    });
    const { onClose, onSaved } = renderPanel();

    submitForm();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("Too short");
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("notifies and stays open when the mutation throws", async () => {
    updateZoneDetails.mockRejectedValue(new Error("boom"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { onClose } = renderPanel();

    submitForm();

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("errors.saveFailed")
    );
    expect(onClose).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  describe("the area half", () => {
    // The reason redrawing commits the text first: the gesture needs this
    // modal gone, and a panel that vanished and dropped what the DM had
    // just typed would be a trap.
    it("saves the pending edits before handing the redraw back", async () => {
      const { onRedrawArea, onClose } = renderPanel();

      fireEvent.change(screen.getByLabelText(nameLabel), {
        target: { value: "Kang Reach" },
      });
      fireEvent.click(screen.getByText("area.redraw"));

      await waitFor(() =>
        expect(updateZoneDetails).toHaveBeenCalledWith({
          id: 7,
          title: "Kang Reach",
          description: "The eastern march.",
        })
      );
      // The just-typed name, not the one the panel opened with — the
      // arming caller keeps it for its failure toast.
      expect(onRedrawArea).toHaveBeenCalledWith("Kang Reach");
      expect(onClose).toHaveBeenCalled();
    });

    it("leaves the map alone when the save fails", async () => {
      updateZoneDetails.mockResolvedValue({
        ok: false,
        errors: { title: ["Too short"] },
      });
      const { onRedrawArea, onClose } = renderPanel();

      fireEvent.click(screen.getByText("area.redraw"));

      await waitFor(() =>
        expect(screen.getByRole("alert")).toBeInTheDocument()
      );
      expect(onRedrawArea).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    // A point-placed place has no rectangle; drawing a first one would
    // convert it into an area, which is a different operation nobody has
    // specified. Disabled and saying why, not silently absent.
    it("disables the redraw and explains itself for a point-placed place", () => {
      renderPanel({ hasFootprint: false });

      expect(screen.getByText("area.redraw").closest("button")).toBeDisabled();
      expect(screen.getByText("area.noArea")).toBeInTheDocument();
    });

    it("offers the redraw for an area", () => {
      renderPanel({ hasFootprint: true });

      expect(
        screen.getByText("area.redraw").closest("button")
      ).not.toBeDisabled();
      expect(screen.getByText("area.redrawHint")).toBeInTheDocument();
    });
  });
});
