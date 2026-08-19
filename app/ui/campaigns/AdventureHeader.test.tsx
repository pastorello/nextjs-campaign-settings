import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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
  timeline: null,
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
    ).toHaveAttribute("href", "/dashboard/campaign");
  });

  it("switches to the edit form and back", () => {
    render(<AdventureHeader adventure={adventure} />);

    fireEvent.click(screen.getByText("common.table.edit"));
    expect(screen.getByTestId("adventure-info-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("adventure-info-form"));
    expect(screen.queryByTestId("adventure-info-form")).not.toBeInTheDocument();
    expect(screen.getByText("Into the Mire")).toBeInTheDocument();
  });
});
