import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_IMAGE_BYTES } from "@/app/lib/storage/imageUploadRules";

import ImageInput from "./ImageInput";

// vitest.setup.ts's next-intl mock returns each key as its own text.

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function png(name = "portrait.png", size?: number) {
  const file = new File(["png-bytes"], name, { type: "image/png" });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("no file input");
  return input;
}

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

describe("ImageInput (SPEC-020 T3)", () => {
  it("offers an upload and no preview when there is no image", () => {
    render(<ImageInput value={null} onChange={vi.fn()} label="Image" />);

    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "common.fields.image.upload" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "common.fields.image.remove" })
    ).not.toBeInTheDocument();
  });

  it("previews the current image's thumbnail by id, with replace and remove", () => {
    render(<ImageInput value={12} onChange={vi.fn()} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "/api/record-images/by-id/12?size=thumb"
    );
    expect(screen.getByRole("img")).toHaveAttribute(
      "alt",
      "common.fields.image.previewAlt"
    );
    expect(
      screen.getByRole("button", { name: "common.fields.image.replace" })
    ).toBeInTheDocument();
  });

  it("uploads a chosen file through the record image route and sets the returned id", async () => {
    respond(201, { id: 42, displayKey: "d", thumbKey: "t" });
    const onChange = vi.fn();
    const { container } = render(
      <ImageInput value={null} onChange={onChange} />
    );

    fireEvent.change(fileInput(container), { target: { files: [png()] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(42));
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/record-images");
    expect(init?.method).toBe("POST");
    expect((init?.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("uploads a dropped file", async () => {
    respond(201, { id: 7 });
    const onChange = vi.fn();
    render(<ImageInput value={null} onChange={onChange} />);

    fireEvent.drop(screen.getByTestId("image-drop-zone"), {
      dataTransfer: { files: [png()] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(7));
  });

  it("highlights the drop zone while a file is dragged over it", () => {
    render(<ImageInput value={null} onChange={vi.fn()} />);
    const zone = screen.getByTestId("image-drop-zone");

    fireEvent.dragOver(zone);
    expect(zone).toHaveClass("border-blue-600");

    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveClass("border-blue-600");
  });

  it("opens the file picker from the upload button", () => {
    const { container } = render(
      <ImageInput value={null} onChange={vi.fn()} />
    );
    const click = vi.spyOn(fileInput(container), "click");

    fireEvent.click(
      screen.getByRole("button", { name: "common.fields.image.upload" })
    );

    expect(click).toHaveBeenCalledTimes(1);
  });

  it("replaces: a new upload swaps the value, the old id is not deleted here", async () => {
    respond(201, { id: 13 });
    const onChange = vi.fn();
    const { container } = render(<ImageInput value={12} onChange={onChange} />);

    fireEvent.change(fileInput(container), { target: { files: [png()] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(13));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("removes: sets the value to null", () => {
    const onChange = vi.fn();
    render(<ImageInput value={12} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: "common.fields.image.remove" })
    );

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it.each([
    ["imageUndecodable", 422],
    ["imageStoreFailed", 500],
    ["imageTooLarge", 413],
  ])(
    "shows the route's %s refusal as a field error and keeps the value",
    async (error, status) => {
      respond(status, { error });
      const onChange = vi.fn();
      const { container } = render(
        <ImageInput value={12} onChange={onChange} />
      );

      fireEvent.change(fileInput(container), { target: { files: [png()] } });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        `common.fieldErrors.${error}`
      );
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it("reports an unreadable refusal as imageStoreFailed", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));
    const { container } = render(
      <ImageInput value={null} onChange={vi.fn()} />
    );

    fireEvent.change(fileInput(container), { target: { files: [png()] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "common.fieldErrors.imageStoreFailed"
    );
  });

  it("refuses a wrong type or an oversized file without uploading", async () => {
    const { container } = render(
      <ImageInput value={null} onChange={vi.fn()} />
    );

    fireEvent.change(fileInput(container), {
      target: { files: [new File(["gif"], "a.gif", { type: "image/gif" })] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "common.fieldErrors.imageUnsupportedType"
    );

    fireEvent.change(fileInput(container), {
      target: { files: [png("big.png", MAX_IMAGE_BYTES + 1)] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "common.fieldErrors.imageTooLarge"
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
