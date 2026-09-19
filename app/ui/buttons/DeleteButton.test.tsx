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
  default: ({
    onSave,
    ariaLabel,
    icon,
    buttonVariant,
  }: {
    onSave?: () => void;
    ariaLabel?: string;
    icon?: React.ReactNode;
    buttonVariant?: string;
  }) => (
    <button
      onClick={onSave}
      aria-label={ariaLabel}
      data-variant={buttonVariant}
    >
      confirm-delete
      {icon}
    </button>
  ),
}));

import DeleteButton from "./DeleteButton";
import ButtonVariant from "./BaseButton/ButtonVariant";

describe("DeleteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  // TD-136: every row's delete button announced as plain "Elimina" — this
  // is what gives each one the item's name instead.
  it("passes an aria-label carrying the item name to ModalButton", () => {
    render(
      <DeleteButton pageName="Fireball" pageId={1} pageType={PageType.Spell} />
    );

    expect(screen.getByText("confirm-delete")).toHaveAttribute(
      "aria-label",
      "table.deleteItem:Fireball"
    );
  });

  // TD-118: the row action is an icon button now, so it needs the quiet
  // ghostDanger variant (secondary at rest, danger only on hover) plus a
  // trash icon rather than the visible "Elimina" text.
  it("renders as a ghostDanger icon button", () => {
    render(
      <DeleteButton pageName="Fireball" pageId={1} pageType={PageType.Spell} />
    );

    const button = screen.getByText("confirm-delete").closest("button");
    expect(button).toHaveAttribute("data-variant", ButtonVariant.ghostDanger);
    expect(button?.querySelector("svg")).not.toBeNull();
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

  // SPEC-021 T2: a refusal carrying a catalogue key (a domain still in use)
  // is shown translated, not as the server's English prose.
  it("translates a keyed refusal rather than showing the server's message", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => ({
        success: false,
        error: "Cannot delete domain",
        refusal: { key: "dhDomainInUse", values: { cards: 2, classes: 0 } },
      }),
    } as unknown as Response);

    render(
      <DeleteButton
        pageName="Veilwright"
        pageId={3}
        pageType={PageType.DhDomain}
      />
    );
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        expect.stringMatching(/^fieldErrors\.dhDomainInUse/)
      )
    );
    expect(global.fetch).toHaveBeenCalledWith("/api/domains/3", {
      method: "DELETE",
    });
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
