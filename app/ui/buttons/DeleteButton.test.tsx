import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${values.name as string}` : key,
}));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const { notifySuccess, notifyError } = vi.hoisted(() => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess,
  notifyError,
}));

// ModalButton owns the confirm dialog and has its own suite. DeleteButton's
// own logic — the fetch call, and how it reports success/failure — lives in
// the `onSave` callback it hands ModalButton, so the stub exposes exactly
// that: a button that fires `onSave`, the same contract ModalButton's real
// "deleteform" branch offers.
vi.mock("./ModalButton", () => ({
  default: ({ onSave }: { onSave?: () => void }) => (
    <button onClick={onSave}>confirm-delete</button>
  ),
}));

import DeleteButton from "./DeleteButton";

describe("DeleteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("deletes, notifies success and refreshes the route on a successful response", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => ({ success: true }),
    } as unknown as Response);

    render(
      <DeleteButton pageName="Fireball" pageId={1} pageType={PageType.Spell} />
    );
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/spells/1", {
        method: "DELETE",
      })
    );
    expect(notifySuccess).toHaveBeenCalledWith("deleteButton.deleted:Fireball");
    expect(refresh).toHaveBeenCalled();
  });

  it("notifies the server-reported error without refreshing on failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => ({ success: false, error: "not found" }),
    } as unknown as Response);

    render(
      <DeleteButton pageName="Fireball" pageId={1} pageType={PageType.Spell} />
    );
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("not found"));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("falls back to a generic failure message when the server sends none", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => ({ success: false }),
    } as unknown as Response);

    render(
      <DeleteButton pageName="Fireball" pageId={1} pageType={PageType.Spell} />
    );
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("deleteButton.deleteFailed")
    );
  });

  it("notifies a network failure when the fetch itself rejects", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("offline"));

    render(
      <DeleteButton pageName="Fireball" pageId={1} pageType={PageType.Spell} />
    );
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("deleteButton.networkFailed")
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
