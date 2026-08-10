import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateZoneMap } = vi.hoisted(() => ({
  updateZoneMap: vi.fn(),
}));
vi.mock("@/app/lib/data/maps/updateZoneMap", () => ({
  default: updateZoneMap,
}));

const { notifyError, notifySuccess } = vi.hoisted(() => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError,
  notifySuccess,
}));

import MapUploadControl from "./MapUploadControl";

describe("MapUploadControl (SPEC-007 T1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "cieli.png" }),
      })
    );
    updateZoneMap.mockResolvedValue({ ok: true });
  });

  it("uploads and saves a map for a place that has none, then reports the new id", async () => {
    const onMapChanged = vi.fn();
    render(
      <MapUploadControl
        placeId={4}
        hasMap={false}
        onMapChanged={onMapChanged}
      />
    );
    fireEvent.change(screen.getByLabelText("uploadLabel"), {
      target: {
        files: [new File(["bytes"], "map.png", { type: "image/png" })],
      },
    });

    fireEvent.click(screen.getByText("uploadSubmit"));

    await waitFor(() =>
      expect(updateZoneMap).toHaveBeenCalledWith({
        id: 4,
        mapImage: "cieli.png",
      })
    );
    expect(onMapChanged).toHaveBeenCalledWith("cieli.png");
    expect(notifySuccess).toHaveBeenCalledWith("success");
  });

  it("does not upload when no file has been chosen", () => {
    render(
      <MapUploadControl placeId={4} hasMap={false} onMapChanged={vi.fn()} />
    );

    fireEvent.click(screen.getByText("uploadSubmit"));

    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks for confirmation before replacing an existing map, and does not upload until confirmed", async () => {
    render(
      <MapUploadControl placeId={4} hasMap={true} onMapChanged={vi.fn()} />
    );
    fireEvent.change(screen.getByLabelText("replaceLabel"), {
      target: {
        files: [new File(["bytes"], "map.png", { type: "image/png" })],
      },
    });

    fireEvent.click(screen.getByText("replaceSubmit"));

    expect(screen.getByText("confirmReplaceTitle")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("confirmReplaceConfirm"));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });

  it("cancelling the confirmation does not upload", () => {
    render(
      <MapUploadControl placeId={4} hasMap={true} onMapChanged={vi.fn()} />
    );
    fireEvent.change(screen.getByLabelText("replaceLabel"), {
      target: {
        files: [new File(["bytes"], "map.png", { type: "image/png" })],
      },
    });
    fireEvent.click(screen.getByText("replaceSubmit"));

    fireEvent.click(screen.getByText("confirmReplaceCancel"));

    expect(fetch).not.toHaveBeenCalled();
  });

  it("notifies and does not report a change when the upload fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const onMapChanged = vi.fn();
    render(
      <MapUploadControl
        placeId={4}
        hasMap={false}
        onMapChanged={onMapChanged}
      />
    );
    fireEvent.change(screen.getByLabelText("uploadLabel"), {
      target: {
        files: [new File(["bytes"], "map.png", { type: "image/png" })],
      },
    });

    fireEvent.click(screen.getByText("uploadSubmit"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("errors.uploadFailed")
    );
    expect(updateZoneMap).not.toHaveBeenCalled();
    expect(onMapChanged).not.toHaveBeenCalled();
  });

  it("notifies and does not report a change when the save mutation fails", async () => {
    updateZoneMap.mockResolvedValue({ ok: false });
    const onMapChanged = vi.fn();
    render(
      <MapUploadControl
        placeId={4}
        hasMap={false}
        onMapChanged={onMapChanged}
      />
    );
    fireEvent.change(screen.getByLabelText("uploadLabel"), {
      target: {
        files: [new File(["bytes"], "map.png", { type: "image/png" })],
      },
    });

    fireEvent.click(screen.getByText("uploadSubmit"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("errors.saveFailed")
    );
    expect(onMapChanged).not.toHaveBeenCalled();
  });
});
