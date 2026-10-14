import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
const refresh = vi.fn();
const push = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));
vi.mock("@/i18n/dashboardPath", () => ({
  dashboardPath: (system: string, path: string) => `/${system}${path}`,
}));
const {
  archiveCampaign,
  restoreCampaign,
  copyCampaign,
  notifyError,
  notifySuccess,
} = vi.hoisted(() => ({
  archiveCampaign: vi.fn(),
  copyCampaign: vi.fn(),
  restoreCampaign: vi.fn(),
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));
vi.mock("@/app/lib/data/campaigns/archiveCampaign", () => ({
  default: archiveCampaign,
}));
vi.mock("@/app/lib/data/campaigns/copyCampaign", () => ({
  default: copyCampaign,
}));
vi.mock("@/app/lib/data/campaigns/restoreCampaign", () => ({
  default: restoreCampaign,
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError,
  notifySuccess,
}));

import CampaignActions from "./CampaignActions";

describe("CampaignActions (SPEC-032 T4)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("archives an active campaign and refreshes the page", async () => {
    archiveCampaign.mockResolvedValue({ ok: true });
    render(<CampaignActions campaignId={3} archived={false} system="dnd5e" />);

    fireEvent.click(screen.getByRole("button", { name: "archive" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(archiveCampaign).toHaveBeenCalledWith({ campaignId: 3 });
    expect(restoreCampaign).not.toHaveBeenCalled();
    expect(notifySuccess).toHaveBeenCalledWith("archived");
  });

  it("restores an archived campaign", async () => {
    restoreCampaign.mockResolvedValue({ ok: true });
    render(<CampaignActions campaignId={3} archived system="dnd5e" />);

    fireEvent.click(screen.getByRole("button", { name: "restore" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(restoreCampaign).toHaveBeenCalledWith({ campaignId: 3 });
    expect(archiveCampaign).not.toHaveBeenCalled();
  });

  it("reports a refusal and does not refresh", async () => {
    archiveCampaign.mockResolvedValue({
      ok: false,
      errors: { campaignId: [{ key: "campaignNotFound" }] },
    });
    render(<CampaignActions campaignId={3} archived={false} system="dnd5e" />);

    fireEvent.click(screen.getByRole("button", { name: "archive" }));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    expect(refresh).not.toHaveBeenCalled();
  });

  it("copies the campaign and lands on the copy's page", async () => {
    copyCampaign.mockResolvedValue({ ok: true, id: 12 });
    render(<CampaignActions campaignId={3} archived={false} system="dnd5e" />);

    fireEvent.click(screen.getByRole("button", { name: "campaignButton" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dnd5e/campaign/12")
    );
    expect(copyCampaign).toHaveBeenCalledWith({ campaignId: 3 });
    expect(notifySuccess).toHaveBeenCalledWith("campaignCopied");
  });

  it("reports a failed copy and stays on the page", async () => {
    copyCampaign.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<CampaignActions campaignId={3} archived={false} system="dnd5e" />);

    fireEvent.click(screen.getByRole("button", { name: "campaignButton" }));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("campaignFailed")
    );
    expect(push).not.toHaveBeenCalled();
  });
});
