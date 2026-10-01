import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addCampaignMember: vi.fn(),
  removeCampaignMember: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/app/lib/data/campaigns/addCampaignMember", () => ({
  default: mocks.addCampaignMember,
}));
vi.mock("@/app/lib/data/campaigns/removeCampaignMember", () => ({
  default: mocks.removeCampaignMember,
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: mocks.notifySuccess,
  notifyError: mocks.notifyError,
}));
vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
  Link: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
}));
vi.mock("@/app/ui/forms/inputs/Select", async () => ({
  default: (await import("@/app/ui/accounts/SelectStub.testkit")).default,
}));

import CampaignPlayersSection from "./CampaignPlayers";

const players = {
  members: [
    { id: "a", name: "Ada", email: "ada@x.test", active: true },
    { id: "c", name: "Cy", email: "cy@x.test", active: false },
  ],
  candidates: [
    { id: "b", name: "Bo" },
    { id: "d", name: "Di" },
  ],
};

describe("CampaignPlayersSection (SPEC-022 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.addCampaignMember.mockResolvedValue({ ok: true });
    mocks.removeCampaignMember.mockResolvedValue({ ok: true });
  });

  it("lists the members, marking a disabled one", () => {
    render(<CampaignPlayersSection campaignId={3} players={players} />);

    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(
      screen.getByText("(accounts.statuses.inactive)")
    ).toBeInTheDocument();
  });

  it("adds the chosen player account", async () => {
    render(<CampaignPlayersSection campaignId={3} players={players} />);

    fireEvent.change(screen.getByLabelText("candidate"), {
      target: { value: "d" },
    });
    fireEvent.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() =>
      expect(mocks.addCampaignMember).toHaveBeenCalledWith({
        campaignId: 3,
        userId: "d",
      })
    );
    expect(mocks.notifySuccess).toHaveBeenCalledWith("added");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("removes a member, naming them on the button", async () => {
    render(<CampaignPlayersSection campaignId={3} players={players} />);

    fireEvent.click(screen.getAllByRole("button", { name: "remove" })[0]!);

    await waitFor(() =>
      expect(mocks.removeCampaignMember).toHaveBeenCalledWith({
        campaignId: 3,
        userId: "a",
      })
    );
    expect(mocks.notifySuccess).toHaveBeenCalledWith("removed");
  });

  it("toasts a refusal", async () => {
    mocks.addCampaignMember.mockResolvedValue({
      ok: false,
      errors: { userId: [{ key: "notAPlayer" }] },
    });
    render(<CampaignPlayersSection campaignId={3} players={players} />);

    fireEvent.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() =>
      expect(mocks.notifyError).toHaveBeenCalledWith(
        "common.fieldErrors.notAPlayer"
      )
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("says so, and links to the accounts, when no player is left to add", () => {
    render(
      <CampaignPlayersSection
        campaignId={3}
        players={{ members: [], candidates: [] }}
      />
    );

    expect(screen.getByText("empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "accountsLink" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/admin/accounts"
    );
    expect(
      screen.queryByRole("button", { name: "add" })
    ).not.toBeInTheDocument();
  });
});
