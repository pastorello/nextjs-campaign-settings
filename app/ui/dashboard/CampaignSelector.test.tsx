import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, refresh, selectCampaign, notifyError } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  selectCampaign: vi.fn<(input: unknown) => Promise<unknown>>(),
  notifyError: vi.fn<(message: string) => void>(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));
vi.mock("@/app/lib/auth/selectCampaign", () => ({
  default: (input: unknown) => selectCampaign(input),
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError: (message: string) => notifyError(message),
}));

import CampaignSelector from "./CampaignSelector";

const campaigns = [
  { id: 1, title: "Rovine", system: "dnd5e" as const },
  { id: 2, title: "Marea", system: "daggerheart" as const },
];

describe("CampaignSelector (SPEC-022 T7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the player's campaigns, the current one selected", () => {
    render(<CampaignSelector campaigns={campaigns} currentId={1} />);

    const select = screen.getByRole("combobox", { name: "campaignSelector" });
    expect(select).toHaveValue("1");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["Rovine", "Marea"]);
  });

  it("switches campaign and opens its map, under its system", async () => {
    selectCampaign.mockResolvedValue({ ok: true, system: "daggerheart" });
    render(<CampaignSelector campaigns={campaigns} currentId={1} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard/daggerheart/geography");
    });
    expect(selectCampaign).toHaveBeenCalledWith({ campaignId: 2 });
  });

  it("says so and refreshes when the campaign is no longer the player's", async () => {
    selectCampaign.mockResolvedValue({ ok: false });
    render(<CampaignSelector campaigns={campaigns} currentId={1} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(notifyError).toHaveBeenCalledWith("campaignUnavailable");
    expect(push).not.toHaveBeenCalled();
  });
});
