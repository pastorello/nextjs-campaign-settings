import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A plain <select> stand-in, as `AssignLocationModal.test.tsx` uses — Select's
// Listbox has its own suite. Values stay strings; the form converts them.
vi.mock("@/app/ui/forms/inputs/Select", () => ({
  default: ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: number | string;
    onChange: (value: string) => void;
    options: { value: number | string; label: string }[];
  }) => (
    <select
      aria-label={label}
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const { createPlaceFromPicker } = vi.hoisted(() => ({
  createPlaceFromPicker: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/createPlaceFromPicker", () => ({
  default: createPlaceFromPicker,
}));

const { notifyError } = vi.hoisted(() => ({ notifyError: vi.fn() }));
vi.mock("@/app/lib/notifications/notify", () => ({ notifyError }));

import CreatePlaceForm from "./CreatePlaceForm";

const zones = [
  { id: 1, title: "Mondo" },
  { id: 5, title: "Skreebars" },
];

function renderForm(defaultParentId: number | null = 5) {
  const props = {
    zones,
    defaultParentId,
    onCreated: vi.fn(),
    onCancel: vi.fn(),
  };
  render(<CreatePlaceForm {...props} />);
  return props;
}

const typeName = (value: string) =>
  fireEvent.change(screen.getByLabelText("geography.fields.title.label"), {
    target: { value },
  });

describe("CreatePlaceForm (SPEC-026)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPlaceFromPicker.mockResolvedValue({
      ok: true,
      place: { kind: "poi", id: 90, parentId: 5 },
    });
  });

  it("asks for a type, a name and a parent, and nothing else", () => {
    renderForm();

    expect(screen.getByLabelText("kindLabel")).toBeInTheDocument();
    expect(
      screen.getByLabelText("geography.fields.title.label")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("parentLabel")).toBeInTheDocument();
    expect(screen.getByText("unplacedNote")).toBeInTheDocument();
  });

  it("preselects a landmark, the DM's default", () => {
    renderForm();

    expect(screen.getByLabelText("kindLabel")).toHaveValue("poi");
  });

  it("defaults the parent to the place in context", () => {
    renderForm(5);

    expect(screen.getByLabelText("parentLabel")).toHaveValue("5");
  });

  it("leaves the parent empty when none can be inferred — never the root", () => {
    renderForm(null);

    expect(screen.getByLabelText("parentLabel")).toHaveValue("0");
  });

  it("creates the place with what was chosen and hands it back", async () => {
    const { onCreated } = renderForm();
    fireEvent.change(screen.getByLabelText("kindLabel"), {
      target: { value: "city" },
    });
    typeName("Skreebars Bassa");
    fireEvent.change(screen.getByLabelText("parentLabel"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByText("create"));

    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith({
        kind: "poi",
        id: 90,
        parentId: 5,
      })
    );
    expect(createPlaceFromPicker).toHaveBeenCalledWith({
      title: "Skreebars Bassa",
      parentId: 1,
      kind: "city",
    });
  });

  it("sends a null parent when none is chosen, for the server to refuse", async () => {
    renderForm(null);
    typeName("Taverna");
    fireEvent.click(screen.getByText("create"));

    await waitFor(() =>
      expect(createPlaceFromPicker).toHaveBeenCalledWith({
        title: "Taverna",
        parentId: null,
        kind: "poi",
      })
    );
  });

  it("keeps what was typed and shows the refusal when creation is refused", async () => {
    createPlaceFromPicker.mockResolvedValue({
      ok: false,
      errors: { parentId: [{ key: "placeNeedsParent" }] },
    });
    const { onCreated } = renderForm(null);
    typeName("Taverna");
    fireEvent.click(screen.getByText("create"));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByLabelText("geography.fields.title.label")).toHaveValue(
      "Taverna"
    );
  });

  it("notifies, and keeps the form, when the database fails", async () => {
    createPlaceFromPicker.mockRejectedValue(new Error("down"));
    const { onCreated } = renderForm();
    typeName("Taverna");
    fireEvent.click(screen.getByText("create"));

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("failed"));
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByLabelText("geography.fields.title.label")).toHaveValue(
      "Taverna"
    );
  });

  it("creates nothing on cancel", () => {
    const { onCancel } = renderForm();
    typeName("Taverna");
    fireEvent.click(screen.getByText("cancel"));

    expect(onCancel).toHaveBeenCalled();
    expect(createPlaceFromPicker).not.toHaveBeenCalled();
  });
});
