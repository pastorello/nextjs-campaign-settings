import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values && "title" in values ? `${key}:${String(values.title)}` : key,
  useFormatter: () => ({ dateTime: () => "1 Oct 2026" }),
}));
const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
const { restoreCampaign } = vi.hoisted(() => ({ restoreCampaign: vi.fn() }));
vi.mock("@/app/lib/data/campaigns/restoreCampaign", () => ({
  default: restoreCampaign,
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

import ArchivedCampaigns from "./ArchivedCampaigns";

const archived = [
  { id: 4, title: "Old group", archivedAt: new Date("2026-10-01") },
];

describe("ArchivedCampaigns (SPEC-032 T4)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing when no campaign is archived", () => {
    const { container } = render(
      <ArchivedCampaigns campaigns={[]} system="dnd5e" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("links each to its page and restores it by id", async () => {
    restoreCampaign.mockResolvedValue({ ok: true });
    render(<ArchivedCampaigns campaigns={archived} system="dnd5e" />);

    expect(screen.getByRole("link", { name: "Old group" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/campaign/4"
    );
    fireEvent.click(screen.getByRole("button", { name: "restore:Old group" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(restoreCampaign).toHaveBeenCalledWith({ campaignId: 4 });
  });
});
