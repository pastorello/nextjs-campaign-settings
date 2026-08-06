import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const createRootPlace = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/maps/createRootPlace", () => ({
  default: (...args: unknown[]) => createRootPlace(...args),
}));

const toastError = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

import CreateWorldForm from "./CreateWorldForm";

function selectFile() {
  const file = new File(["bytes"], "map.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("form.mapLabel"), {
    target: { files: [file] },
  });
}

function fillTitle(value: string) {
  fireEvent.change(screen.getByLabelText("form.nameLabel"), {
    target: { value },
  });
}

describe("CreateWorldForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "uploaded-id.png" }),
      })
    );
  });

  it("shows a field error and does not upload when the name is empty", () => {
    render(<CreateWorldForm />);
    selectFile();

    fireEvent.click(screen.getByText("form.submit"));

    expect(screen.getByText("errors.nameRequired")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows a field error and does not upload when no map is selected", () => {
    render(<CreateWorldForm />);
    fillTitle("Aerivel");

    fireEvent.click(screen.getByText("form.submit"));

    expect(screen.getByText("errors.mapRequired")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uploads the map, creates the root and refreshes on success", async () => {
    createRootPlace.mockResolvedValue({ ok: true });
    render(<CreateWorldForm />);
    fillTitle("Aerivel");
    selectFile();

    fireEvent.click(screen.getByText("form.submit"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/maps/upload",
      expect.objectContaining({ method: "POST" })
    );
    expect(createRootPlace).toHaveBeenCalledWith({
      title: "Aerivel",
      mapImage: "uploaded-id.png",
    });
  });

  it("shows an error toast and does not create the root when the upload fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<CreateWorldForm />);
    fillTitle("Aerivel");
    selectFile();

    fireEvent.click(screen.getByText("form.submit"));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("errors.uploadFailed")
    );
    expect(createRootPlace).not.toHaveBeenCalled();
  });

  it("shows an error toast when the root cannot be created", async () => {
    createRootPlace.mockResolvedValue({ ok: false, errors: {} });
    render(<CreateWorldForm />);
    fillTitle("Aerivel");
    selectFile();

    fireEvent.click(screen.getByText("form.submit"));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("errors.createFailed")
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
