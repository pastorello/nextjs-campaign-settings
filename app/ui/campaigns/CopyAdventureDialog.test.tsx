import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
const push = vi.fn();
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }));
const { copyAdventure, notifyError, notifySuccess } = vi.hoisted(() => ({
  copyAdventure: vi.fn(),
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
vi.mock("@/app/lib/data/campaigns/copyAdventure", () => ({
  default: copyAdventure,
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError,
  notifySuccess,
}));

import CopyAdventureDialog from "./CopyAdventureDialog";

describe("CopyAdventureDialog (SPEC-032 T5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("copies into the first destination and opens the copy", async () => {
    copyAdventure.mockResolvedValue({ ok: true, id: 99 });
    const onClose = vi.fn();
    render(
      <CopyAdventureDialog
        adventure={{ id: 7, title: "Vault" }}
        destinations={[{ id: 2, title: "Second group" }]}
        allowStandalone={false}
        system="dnd5e"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "confirm" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(copyAdventure).toHaveBeenCalledWith({
      adventureId: 7,
      destinationCampaignId: 2,
    });
    expect(push.mock.calls[0]![0]).toContain("/adventure/99");
    expect(onClose).toHaveBeenCalled();
  });

  it("says so, and does not offer to copy, with nowhere to go", () => {
    render(
      <CopyAdventureDialog
        adventure={{ id: 7, title: "Vault" }}
        destinations={[]}
        allowStandalone={false}
        system="daggerheart"
        onClose={() => {}}
      />
    );

    expect(screen.getByText("noDestination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "confirm" })).toBeDisabled();
  });

  it("reports a refusal and stays open", async () => {
    copyAdventure.mockResolvedValue({
      ok: false,
      errors: { destinationCampaignId: [{ key: "copyWrongSystem" }] },
    });
    const onClose = vi.fn();
    render(
      <CopyAdventureDialog
        adventure={{ id: 7, title: "Vault" }}
        destinations={[{ id: 2, title: "Second group" }]}
        allowStandalone
        system="dnd5e"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "confirm" }));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
