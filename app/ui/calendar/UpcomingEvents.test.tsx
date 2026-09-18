import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { universalCountFixture as universal } from "@/app/lib/calendar/dateSystemFixtures";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import UpcomingEvents from "./UpcomingEvents";

const festival = {
  id: 1,
  title: "Festival of Lanterns",
  description: null,
  startDay: 2,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: true,
};

function renderUpcoming(
  upcoming: Parameters<typeof UpcomingEvents>[0]["upcoming"]
) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <UpcomingEvents
        upcoming={upcoming}
        displaySystem={universal}
        system="dnd5e"
      />
    </NextIntlClientProvider>
  );
}

describe("UpcomingEvents (SPEC-014 T6)", () => {
  it("renders nothing when nothing is coming up", () => {
    renderUpcoming([]);

    expect(screen.queryByTestId("upcoming-events")).not.toBeInTheDocument();
  });

  it("dates each event on its next occurrence and links to the calendar", () => {
    // The festival was first held on day 2; it next falls in year 3.
    renderUpcoming([
      { event: festival, startDay: 3 * 365 + 2, endDay: 3 * 365 + 2 },
    ]);

    const section = screen.getByTestId("upcoming-events");
    expect(section).toHaveTextContent("Festival of Lanterns");
    expect(section).toHaveTextContent("3 Gennaio 3");
    expect(
      screen.getByRole("link", {
        name: en.calendar.campaign.upcoming.openCalendar,
      })
    ).toHaveAttribute("href", "/dashboard/dnd5e/campaign/calendar");
  });
});
