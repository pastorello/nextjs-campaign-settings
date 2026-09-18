import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import {
  humanCountFixture,
  universalCountFixture as universal,
} from "@/app/lib/calendar/dateSystemFixtures";
import WorldDateValue from "@/app/lib/definitions/interfaces/calendar/WorldDateValue";
import en from "@/messages/en.json";
import WorldDateInput from "./WorldDateInput";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));

// The human count as the world default, so the input opens in it.
const human = { ...humanCountFixture, isDefault: true };
const plainUniversal = { ...universal, isDefault: false };
const systems = [plainUniversal, human];
const ANCHOR = human.anchorYear;

function renderInput(value: WorldDateValue, error?: string) {
  const onChange = vi.fn<(value: WorldDateValue) => void>();
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <WorldDateInput
        legend="Start"
        systems={systems}
        value={value}
        onChange={onChange}
        error={error}
      />
    </NextIntlClientProvider>
  );
  return onChange;
}

const field = (name: string) => screen.getByLabelText(name);

describe("WorldDateInput (SPEC-014 §5.8, T4)", () => {
  it("groups its labelled fields under the legend, in the default system", () => {
    renderInput({ universalDay: null, hour: null });

    expect(screen.getByRole("group", { name: "Start" })).toBeInTheDocument();
    expect(field("Date system")).toHaveValue(String(human.id));
    expect(field("Year")).toHaveValue(null);
    expect(field("Month")).toHaveDisplayValue("Brumaio");
    expect(field("Hour")).toHaveDisplayValue("No hour");
  });

  it("shows a stored day through the same conversion it was typed through", () => {
    // 3 March of human year −330, 14:00.
    renderInput({
      universalDay: (ANCHOR - 330) * 365 + 31 + 28 + 2,
      hour: 14,
    });

    expect(field("Year")).toHaveValue(-330);
    expect(field("Month")).toHaveDisplayValue("Piovoso");
    expect(field("Day")).toHaveValue(3);
    expect(field("Hour")).toHaveDisplayValue("14:00");
    expect(screen.getByText(/3 Piovoso 330 a\.C\., 14:00/)).toBeInTheDocument();
  });

  it("reports a universal day as the DM types across the anchor", () => {
    const onChange = renderInput({ universalDay: null, hour: null });

    fireEvent.change(field("Day"), { target: { value: "1" } });
    fireEvent.change(field("Year"), { target: { value: "0" } });
    expect(onChange).toHaveBeenLastCalledWith({
      universalDay: ANCHOR * 365,
      hour: null,
    });

    fireEvent.change(field("Year"), { target: { value: "-1" } });
    fireEvent.change(field("Month"), { target: { value: "11" } });
    fireEvent.change(field("Day"), { target: { value: "31" } });
    fireEvent.change(field("Hour"), { target: { value: "9" } });
    expect(onChange).toHaveBeenLastCalledWith({
      universalDay: ANCHOR * 365 - 1,
      hour: 9,
    });
    expect(screen.getByText(/31 Frimaio 1 a\.C\., 09:00/)).toBeInTheDocument();
  });

  it("keeps the same day when the system is switched, re-labelling the year", () => {
    const universalDay = (ANCHOR + 12) * 365 + 5;
    const onChange = renderInput({ universalDay, hour: null });

    fireEvent.change(field("Date system"), {
      target: { value: String(plainUniversal.id) },
    });

    expect(field("Year")).toHaveValue(ANCHOR + 12);
    expect(field("Month")).toHaveDisplayValue("Gennaio");
    expect(field("Day")).toHaveValue(6);
    expect(onChange).toHaveBeenLastCalledWith({ universalDay, hour: null });
  });

  it("flags a day the month does not have, on the day field", () => {
    const onChange = renderInput({ universalDay: null, hour: null });

    fireEvent.change(field("Year"), { target: { value: "3" } });
    fireEvent.change(field("Month"), { target: { value: "3" } });
    fireEvent.change(field("Day"), { target: { value: "31" } });

    expect(field("Day")).toHaveAttribute("aria-invalid", "true");
    expect(field("Day")).toHaveAccessibleDescription("This month has 30 days.");
    expect(onChange).toHaveBeenLastCalledWith({
      universalDay: null,
      hour: null,
    });
  });

  it("flags a date before the dawn of time, on the year field", () => {
    const onChange = renderInput({ universalDay: null, hour: null });

    fireEvent.change(field("Day"), { target: { value: "1" } });
    fireEvent.change(field("Year"), { target: { value: String(-ANCHOR - 1) } });

    expect(field("Year")).toHaveAttribute("aria-invalid", "true");
    expect(field("Year")).toHaveAccessibleDescription(
      "This date is before the dawn of time."
    );
    expect(field("Day")).not.toHaveAttribute("aria-invalid");
    expect(onChange).toHaveBeenLastCalledWith({
      universalDay: null,
      hour: null,
    });
  });

  it("describes the group with a form-level error", () => {
    renderInput(
      { universalDay: 0, hour: null },
      "Must not be before the start."
    );

    expect(
      screen.getByRole("group", { name: "Start" })
    ).toHaveAccessibleDescription("Must not be before the start.");
  });
});
