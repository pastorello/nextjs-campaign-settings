import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import {
  humanCountFixture as human,
  universalCountFixture as universal,
} from "@/app/lib/calendar/dateSystemFixtures";
import DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import it_messages from "@/messages/it.json";
import WorldDate from "./WorldDate";

// The real translator, not the global key-echo mock: the point here is the
// text the catalogue's pattern produces.
vi.mock("next-intl", async () => await vi.importActual("next-intl"));

const ANCHOR = human.anchorYear;

function renderDate(universalDay: number, system: DateSystem, hour?: number) {
  return render(
    <NextIntlClientProvider locale="it" messages={it_messages}>
      <WorldDate universalDay={universalDay} hour={hour} system={system} />
    </NextIntlClientProvider>
  );
}

describe("WorldDate (SPEC-014 T4)", () => {
  // 3 March of human year −330; ANCHOR − 330 = 5440 in the universal count.
  const day = (ANCHOR - 330) * 365 + 31 + 28 + 2;

  it("shows one day in the human count", () => {
    renderDate(day, human, 14);
    expect(
      screen.getByText(/^\S+ 3 Piovoso 330 a\.C\., 14:00$/)
    ).toBeInTheDocument();
  });

  it("shows the same day in the universal count", () => {
    renderDate(day, universal);
    expect(
      screen.getByText(new RegExp(`^\\S+ 3 Marzo ${ANCHOR - 330} a\\.T\\.$`))
    ).toBeInTheDocument();
  });

  it("names the weekday from the system", () => {
    renderDate(0, universal);
    expect(screen.getByText("Lunedì 1 Gennaio 0 a.T.")).toBeInTheDocument();
  });
});
