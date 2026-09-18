import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  humanCountFixture as human,
  universalCountFixture as universal,
} from "@/app/lib/calendar/dateSystemFixtures";
import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
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
vi.mock("@/app/lib/data/calendar/deleteWorldHistoryEventById", () => ({
  default: (id: number) => deleteEvent(id),
}));

vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock("./WorldHistoryEventForm", () => ({
  default: ({ event }: { event?: WorldHistoryEvent }) => (
    <div data-testid="event-form">{event?.title ?? "new"}</div>
  ),
}));

import WorldHistoryList from "./WorldHistoryList";

const ANCHOR_DAY = human.anchorYear * 365;

const base: WorldHistoryEvent = {
  id: 1,
  title: "The Cataclysm",
  description: "The sky fell.",
  startDay: ANCHOR_DAY,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
  zones: [],
  npcs: [],
  deities: [],
  factions: [],
};

const events: WorldHistoryEvent[] = [
  { ...base, id: 1, startDay: ANCHOR_DAY - 365 + 40 }, // year −1, Nevoso
  {
    ...base,
    id: 2,
    title: "Moon festival",
    startDay: ANCHOR_DAY + 3,
    repeatsYearly: true,
    zones: [{ id: 9, name: "Kang" }],
    npcs: [{ id: 4, name: "Aldo & Co" }],
  },
  { ...base, id: 3, title: "Founding", startDay: ANCHOR_DAY + 70 }, // Piovoso
];

function renderList(list = events, displaySystem = human) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <WorldHistoryList
        events={list}
        systems={[universal, human]}
        displaySystem={displaySystem}
        linkOptions={{ zones: [], npcs: [], deities: [], factions: [] }}
      />
    </NextIntlClientProvider>
  );
}

describe("WorldHistoryList (SPEC-014 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups events under year headings in the displayed system", () => {
    renderList();

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    ).toEqual(["1 a.C.", "0 d.C."]);
  });

  it("re-labels the years when another system is displayed", () => {
    renderList(events, universal);

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    ).toEqual(["5769 a.T.", "5770 a.T."]);
  });

  it("groups by month inside a year, with the system's month names", () => {
    renderList();

    expect(
      screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
    ).toEqual(["Nevoso", "Brumaio", "Piovoso"]);
  });

  it("marks a yearly event once, as yearly", () => {
    renderList();

    const items = screen.getAllByTestId("world-history-event");
    expect(items).toHaveLength(3);
    expect(within(items[1]!).getByText("Yearly")).toBeInTheDocument();
    expect(within(items[0]!).queryByText("Yearly")).not.toBeInTheDocument();
  });

  it("shows links by name, leading to the place's map and the NPC list", () => {
    renderList();

    expect(screen.getByRole("link", { name: "Kang" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/geography?place=9"
    );
    expect(screen.getByRole("link", { name: "Aldo & Co" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/npc?query=Aldo%20%26%20Co"
    );
  });

  it("shows an end date after the start", () => {
    renderList([{ ...base, endDay: ANCHOR_DAY + 1, endHour: 9 }]);

    expect(screen.getByTestId("world-history-event").textContent).toMatch(
      /0 d\.C\. – .*0 d\.C\., 09:00/
    );
  });

  it("says so when there is nothing to show", () => {
    renderList([]);

    expect(
      screen.getByText(en.calendar.history.list.emptyMessage)
    ).toBeInTheDocument();
  });

  it("opens the form to add and to edit", () => {
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "New event" }));
    expect(screen.getByTestId("event-form")).toHaveTextContent("new");

    const [first] = screen.getAllByTestId("world-history-event");
    fireEvent.click(within(first!).getByRole("button", { name: "Edit" }));
    expect(within(first!).getByTestId("event-form")).toHaveTextContent(
      "The Cataclysm"
    );
  });

  it("deletes only after the confirm dialog", async () => {
    deleteEvent.mockResolvedValue();
    renderList();

    const [first] = screen.getAllByTestId("world-history-event");
    fireEvent.click(within(first!).getByRole("button", { name: "Delete" }));
    expect(deleteEvent).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith(1));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
