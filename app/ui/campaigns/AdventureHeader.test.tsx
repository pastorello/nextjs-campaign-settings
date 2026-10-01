import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

vi.mock("./AdventureInfoForm", () => ({
  default: ({ onCancel }: { onCancel: () => void }) => (
    <button onClick={onCancel} data-testid="adventure-info-form">
      form-stub
    </button>
  ),
}));

import AdventureHeader from "./AdventureHeader";

const adventure = {
  id: 10,
  campaignId: 1,
  position: 1,
  targetLevel: 3,
  title: "Into the Mire",
  synopsis: "A poor coastline haunted by an old war.",
  status: AdventureStatus.Active,
  xpTarget: null,
  currencyTarget: null,
  currencyUnit: null,
  permanentItemTarget: null,
  consumableTarget: null,
};

describe("AdventureHeader (SPEC-013 T8)", () => {
  it("shows the adventure's title, level and synopsis", () => {
    render(<AdventureHeader adventure={adventure} />);

    expect(screen.getByText("Into the Mire")).toBeInTheDocument();
    expect(
      screen.getByText("A poor coastline haunted by an old war.")
    ).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("links back to the campaign page", () => {
    render(<AdventureHeader adventure={adventure} />);

    expect(
      screen.getByRole("link", { name: "adventure.backToCampaign" })
    ).toHaveAttribute("href", "/dashboard/dnd5e/campaign");
  });

  it("switches to the edit form and back", () => {
    render(<AdventureHeader adventure={adventure} />);

    fireEvent.click(screen.getByText("common.table.edit"));
    expect(screen.getByTestId("adventure-info-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("adventure-info-form"));
    expect(screen.queryByTestId("adventure-info-form")).not.toBeInTheDocument();
    expect(screen.getByText("Into the Mire")).toBeInTheDocument();
  });

  // SPEC-030 T2.
  it("shows a Daggerheart adventure's tier, and no currency unit", () => {
    render(<AdventureHeader adventure={adventure} rulesSystem="daggerheart" />);

    expect(
      screen.getByText(/adventure\.tier \{"tier":2\}/)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/adventure\.fields\.currencyUnit\.label/)
    ).toBeNull();
  });
});
