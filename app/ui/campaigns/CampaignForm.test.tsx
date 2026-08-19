import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
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
      expect.objectContaining({ title: "The Silver Coast", partySize: 4 })
    );
    expect(updateCampaign).not.toHaveBeenCalled();
  });

  it("shows field errors and does not refresh when creation is rejected", async () => {
    createCampaign.mockResolvedValue({
      ok: false,
      errors: { title: ["Required"] },
    });
    render(<CampaignForm />);

    fireEvent.click(screen.getByText("campaign.form.createButton"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Required")
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
        }}
      />
    );

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
    expect(createCampaign).not.toHaveBeenCalled();
  });
});
