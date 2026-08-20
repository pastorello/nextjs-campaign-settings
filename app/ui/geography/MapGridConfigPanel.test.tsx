import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateZoneGrid } = vi.hoisted(() => ({
  updateZoneGrid: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/updateZoneGrid", () => ({
  default: updateZoneGrid,
}));

const { notifyError, notifySuccess } = vi.hoisted(() => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError,
  notifySuccess,
}));

import GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import MapGridConfigPanel from "./MapGridConfigPanel";

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof MapGridConfigPanel>> = {}
) {
  const props = {
    placeId: 7,
    isOpen: true,
    onClose: vi.fn(),
    gridColumns: null,
    gridScale: null,
    imageSize: { width: 1800, height: 1200 },
    onSaved: vi.fn(),
    ...overrides,
  };
  render(<MapGridConfigPanel {...props} />);
  return props;
}

describe("MapGridConfigPanel (SPEC-015 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateZoneGrid.mockResolvedValue({ ok: true });
  });

  it("shows nothing when closed", () => {
    renderPanel({ isOpen: false });

    expect(
      screen.queryByText("geography.fields.gridColumns.label")
    ).not.toBeInTheDocument();
  });

  it("renders the derived height as — when the aspect ratio is not known", () => {
    renderPanel({ imageSize: null, gridColumns: 36 });

    // §5's edge-case table: never `0`, never a guess.
    expect(screen.getByTestId("derived-rows")).toHaveTextContent("—");
  });

  it("renders the derived height as — until a usable width is typed", () => {
    renderPanel();

    expect(screen.getByTestId("derived-rows")).toHaveTextContent("—");
  });

  it("derives the height from the width and the image's aspect ratio", () => {
    renderPanel();

    const input = screen.getByLabelText("geography.fields.gridColumns.label");
    fireEvent.change(input, { target: { value: "36" } });

    // 36 columns over a 1800×1200 image → 24 rows.
    expect(screen.getByTestId("derived-rows")).toHaveTextContent("24");
  });

  it("prefills the stored configuration when reopened", () => {
    renderPanel({ gridColumns: 36, gridScale: GridScale.Kingdom });

    expect(
      screen.getByLabelText("geography.fields.gridColumns.label")
    ).toHaveValue("36");
    expect(screen.getByTestId("derived-rows")).toHaveTextContent("24");
  });

  it("is completable with the keyboard alone", async () => {
    const props = renderPanel();

    // Width: a native labelled input — focusable and typable.
    const input = screen.getByLabelText("geography.fields.gridColumns.label");
    input.focus();
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "36" } });

    // Scale: a native labelled <select> — arrow-key selection fires exactly
    // this change event.
    const scaleSelect = screen.getByLabelText(
      "geography.fields.gridScale.label"
    );
    scaleSelect.focus();
    expect(document.activeElement).toBe(scaleSelect);
    fireEvent.change(scaleSelect, { target: { value: GridScale.Kingdom } });

    // Submit: a native form with a `type="submit"` button, so Enter in the
    // width field submits it in a real browser — jsdom does not emulate
    // implicit submission, so the test fires the form's submit event, which
    // is exactly what that keypress produces.
    const form = input.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(updateZoneGrid).toHaveBeenCalledWith({
        id: 7,
        gridColumns: 36,
        gridScale: GridScale.Kingdom,
      });
    });
    await waitFor(() => {
      expect(props.onSaved).toHaveBeenCalledWith(36, GridScale.Kingdom);
    });
    expect(props.onClose).toHaveBeenCalled();
    expect(notifySuccess).toHaveBeenCalled();
  });

  it("shows the server's field-level errors and stays open", async () => {
    updateZoneGrid.mockResolvedValue({
      ok: false,
      errors: { gridColumns: ["Too big"] },
    });
    const props = renderPanel();

    const input = screen.getByLabelText("geography.fields.gridColumns.label");
    fireEvent.change(input, { target: { value: "9999" } });
    fireEvent.submit(input.closest("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Too big");
    expect(props.onSaved).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("reports a thrown save as a notification, not a crash", async () => {
    updateZoneGrid.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const props = renderPanel();

    fireEvent.submit(
      screen
        .getByLabelText("geography.fields.gridColumns.label")
        .closest("form")!
    );

    await waitFor(() => {
      expect(notifyError).toHaveBeenCalled();
    });
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
