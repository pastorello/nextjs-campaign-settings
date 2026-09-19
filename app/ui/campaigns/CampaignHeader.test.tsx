import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("./CampaignForm", () => ({
  default: ({ onCancel }: { onCancel: () => void }) => (
    <button onClick={onCancel} data-testid="campaign-form">
      form-stub
    </button>
  ),
}));

import CampaignHeader from "./CampaignHeader";

const campaign = {
  id: 1,
  title: "The Silver Coast",
  synopsis: "A poor coastline haunted by an old war.",
  partySize: 5,
  system: "dnd5e" as const,
};

describe("CampaignHeader (SPEC-013 T7)", () => {
  it("shows the campaign's title, synopsis and party size", () => {
    render(<CampaignHeader campaign={campaign} />);

    expect(screen.getByText("The Silver Coast")).toBeInTheDocument();
    expect(
      screen.getByText("A poor coastline haunted by an old war.")
    ).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("shows a formatted synopsis formatted (SPEC-019 T5)", () => {
    render(
      <CampaignHeader
        campaign={{
          ...campaign,
          synopsis: "<p>A <strong>poor</strong> coastline.</p>",
        }}
      />
    );

    expect(screen.getByText("poor").tagName).toBe("STRONG");
  });

  it("switches to the edit form and back", () => {
    render(<CampaignHeader campaign={campaign} />);

    fireEvent.click(screen.getByText("common.table.edit"));
    expect(screen.getByTestId("campaign-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("campaign-form"));
    expect(screen.queryByTestId("campaign-form")).not.toBeInTheDocument();
    expect(screen.getByText("The Silver Coast")).toBeInTheDocument();
  });
});
