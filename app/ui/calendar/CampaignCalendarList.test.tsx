import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { universalCountFixture as universal } from "@/app/lib/calendar/dateSystemFixtures";
import CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

const deleteEvent = vi.fn<(id: number) => Promise<void>>();
vi.mock("@/app/lib/data/calendar/deleteCampaignEventById", () => ({
  default: (id: number) => deleteEvent(id),
}));

vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock("./CampaignEventForm", () => ({
  default: ({ event }: { event?: CampaignEvent }) => (
    <div data-testid="event-form">{event?.title ?? "new"}</div>
  ),
}));

import CampaignCalendarList from "./CampaignCalendarList";

const event = (
  id: number,
  title: string,
  startDay: number,
  extra: Partial<CampaignEvent> = {}
): CampaignEvent => ({
  id,
  title,
  description: null,
  startDay,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
  adventure: null,
  scene: null,
  ...extra,
});

const history: CalendarEventBase = {
  id: 1,
  title: "The Cataclysm",
  description: null,
  startDay: 12,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
};

function renderList(events: CampaignEvent[], today: number | null) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CampaignCalendarList
        campaignId={1}
        events={events}
        history={[history]}
        today={today}
        systems={[universal]}
        displaySystem={universal}
        ownerOptions={{ adventures: [], scenes: [] }}
      />
    </NextIntlClientProvider>
  );
}

const item = (title: string) =>
  screen.getAllByRole("listitem").find((li) => li.textContent?.includes(title));

describe("CampaignCalendarList (SPEC-014 T6)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks events past, current and upcoming against today, in words too", () => {
    renderList(
      [
        event(1, "Past raid", 5),
        event(2, "Ongoing siege", 8, { endDay: 14 }),
        event(3, "Coming storm", 20),
      ],
      10
    );

    expect(item("Past raid")).toHaveAttribute("data-timing", "past");
    expect(
      within(item("Past raid")!).getByText(en.calendar.campaign.list.past)
    ).toBeInTheDocument();
    expect(item("Ongoing siege")).toHaveAttribute("data-timing", "current");
    expect(item("Ongoing siege")).toHaveTextContent(
      en.calendar.campaign.list.current
    );
    expect(item("Coming storm")).toHaveAttribute("data-timing", "upcoming");
  });

  it("marks nothing without a current day", () => {
    renderList([event(1, "Past raid", 5)], null);

    expect(item("Past raid")).not.toHaveAttribute("data-timing");
    expect(
      within(item("Past raid")!).queryByText(en.calendar.campaign.list.past)
    ).not.toBeInTheDocument();
  });

  it("interleaves world history, marked and without edit or delete", () => {
    renderList([event(1, "Past raid", 5), event(2, "Coming storm", 20)], 10);

    const titles = screen
      .getAllByRole("listitem")
      .map((li) => li.querySelector("p")?.firstChild?.textContent);
    expect(titles).toEqual(["Past raid", "The Cataclysm", "Coming storm"]);

    const historyItem = screen.getByTestId("calendar-history-event");
    expect(historyItem).toHaveTextContent(
      en.calendar.campaign.list.worldHistory
    );
    expect(within(historyItem).queryByRole("button")).not.toBeInTheDocument();
  });

  it("links an event's adventure and names its scene", () => {
    renderList(
      [
        event(1, "Ambush", 20, {
          adventure: { id: 10, name: "Into the Mire" },
          scene: { id: 100, name: "The fog" },
        }),
      ],
      null
    );

    expect(screen.getByRole("link", { name: "Into the Mire" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/campaign/10"
    );
    expect(item("Ambush")).toHaveTextContent("The fog");
  });

  it("deletes a campaign event after confirming", async () => {
    deleteEvent.mockResolvedValue();
    renderList([event(7, "Coming storm", 20)], null);

    fireEvent.click(
      within(screen.getByTestId("campaign-event")).getByRole("button", {
        name: en.common.form.delete,
      })
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: en.common.form.delete,
      })
    );

    await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith(7));
    expect(refresh).toHaveBeenCalled();
  });
});
