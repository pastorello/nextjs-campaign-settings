import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { universalCountFixture as universal } from "@/app/lib/calendar/dateSystemFixtures";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh }) }));

const setCurrentDay =
  vi.fn<
    (
      campaignId: number,
      data: { currentDay: number | null }
    ) => Promise<MutationResult>
  >();
vi.mock("@/app/lib/data/calendar/setCampaignCurrentDay", () => ({
  default: (campaignId: number, data: { currentDay: number | null }) =>
    setCurrentDay(campaignId, data),
}));

import CurrentDayForm from "./CurrentDayForm";

function renderForm(currentDay: number | null) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CurrentDayForm
        campaignId={1}
        systems={[universal]}
        currentDay={currentDay}
        displaySystem={universal}
      />
    </NextIntlClientProvider>
  );
}

const button = (name: string) => screen.getByRole("button", { name });

describe("CurrentDayForm (SPEC-014 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentDay.mockResolvedValue({ ok: true });
  });

  it("says nothing reads as past while no day is set, and offers neither advance nor clear", () => {
    renderForm(null);

    expect(screen.getByTestId("current-day-value")).toHaveTextContent(
      en.calendar.campaign.today.unset
    );
    expect(
      screen.queryByRole("button", {
        name: en.calendar.campaign.today.advanceButton,
      })
    ).not.toBeInTheDocument();
  });

  it("sets the day typed", async () => {
    renderForm(null);

    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "3" } });
    fireEvent.click(button(en.common.form.save));

    await waitFor(() =>
      expect(setCurrentDay).toHaveBeenCalledWith(1, { currentDay: 367 })
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("advances one day, and clears", async () => {
    renderForm(400);

    fireEvent.click(button(en.calendar.campaign.today.advanceButton));
    await waitFor(() =>
      expect(setCurrentDay).toHaveBeenCalledWith(1, { currentDay: 401 })
    );

    fireEvent.click(button(en.calendar.campaign.today.clearButton));
    await waitFor(() =>
      expect(setCurrentDay).toHaveBeenCalledWith(1, { currentDay: null })
    );
  });
});
