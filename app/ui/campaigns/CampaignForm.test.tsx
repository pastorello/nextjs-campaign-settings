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

vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

// `GAME_SYSTEMS` holds `dnd5e` alone until T4, so a second system is faked
// here to exercise the choice. Everything else in the module is real.
vi.mock("@/app/lib/definitions/GameSystem", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/app/lib/definitions/GameSystem")>();
  const systems = ["dnd5e", "daggerheart"] as const;
  return {
    ...actual,
    GAME_SYSTEMS: systems,
    isGameSystem: (value: unknown) =>
      (systems as readonly unknown[]).includes(value),
  };
});

// A native <select> stands in for the Headless UI listbox, which jsdom
// cannot drive by label.
vi.mock("@/app/ui/forms/inputs/Select", () => ({
  default: ({
    label,
    value,
    options = [],
    onChange,
  }: {
    label?: string;
    value: string;
    options?: { value: string; label: string }[];
    onChange: (value: string) => void;
  }) => (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

const createCampaign = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/createCampaign", () => ({
  default: (...args: unknown[]) => createCampaign(...args),
}));

const updateCampaign = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/updateCampaign", () => ({
  default: (...args: unknown[]) => updateCampaign(...args),
}));

import CampaignForm from "./CampaignForm";

function fillTitle(value: string) {
  fireEvent.change(screen.getByLabelText("campaign.fields.title.label"), {
    target: { value },
  });
}

describe("CampaignForm (SPEC-013 T7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a campaign with the entered fields and refreshes on success", async () => {
    createCampaign.mockResolvedValue({ ok: true });
    render(<CampaignForm />);

    fillTitle("The Silver Coast");
    fireEvent.click(screen.getByText("campaign.form.createButton"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "The Silver Coast",
        partySize: 4,
        // SPEC-018 T3: preselected from the route's system.
        system: "dnd5e",
      })
    );
    expect(updateCampaign).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("asks for the system, and opens a campaign of another system under its own URL", async () => {
    createCampaign.mockResolvedValue({ ok: true });
    render(<CampaignForm />);

    fillTitle("The Silver Coast");
    fireEvent.change(screen.getByLabelText("campaign.fields.system.label"), {
      target: { value: "daggerheart" },
    });
    fireEvent.click(screen.getByText("campaign.form.createButton"));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/daggerheart/campaign")
    );
    expect(createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ system: "daggerheart" })
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows field errors and does not refresh when creation is rejected", async () => {
    createCampaign.mockResolvedValue({
      ok: false,
      errors: { title: [{ key: "invalidType" }] },
    });
    render(<CampaignForm />);

    fireEvent.click(screen.getByText("campaign.form.createButton"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "common.fieldErrors.invalidType"
      )
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("updates the existing campaign, by id, in edit mode", async () => {
    updateCampaign.mockResolvedValue({ ok: true });
    render(
      <CampaignForm
        campaign={{
          id: 1,
          title: "The Silver Coast",
          synopsis: null,
          partySize: 5,
          system: "dnd5e",
        }}
      />
    );

    // A campaign does not switch systems: no control, and nothing sent.
    expect(
      screen.queryByLabelText("campaign.fields.system.label")
    ).not.toBeInTheDocument();
    fillTitle("The Golden Coast");
    fireEvent.click(screen.getByText("campaign.form.editButton"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(updateCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        title: "The Golden Coast",
        partySize: 5,
      })
    );
    expect(updateCampaign.mock.calls[0]?.[0]).not.toHaveProperty("system");
    expect(createCampaign).not.toHaveBeenCalled();
  });
});
