import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  humanCountFixture,
  universalCountFixture,
} from "@/app/lib/calendar/dateSystemFixtures";

vi.mock("next-intl/server", () => ({
  getTranslations: (namespace: string) =>
    Promise.resolve((key: string) => `${namespace}.${key}`),
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const fetchDateSystems = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/calendar/fetchDateSystems", () => ({
  default: () => fetchDateSystems(),
}));
const fetchCalendarSettings = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/calendar/fetchCalendarSettings", () => ({
  default: () => fetchCalendarSettings(),
}));
const readDisplayDateSystemId = vi.fn<() => unknown>();
vi.mock("@/app/lib/data/calendar/readDisplayDateSystemId", () => ({
  default: () => readDisplayDateSystemId(),
}));

vi.mock("@/app/ui/calendar/DateSystemsPanel", () => ({
  default: ({ systems }: { systems: { name: string }[] }) => (
    <ul data-testid="panel">
      {systems.map((system) => (
        <li key={system.name}>{system.name}</li>
      ))}
    </ul>
  ),
}));
vi.mock("@/app/ui/calendar/DateSystemToggle", () => ({
  default: ({ selectedId }: { selectedId: number }) => (
    <div data-testid="toggle">{selectedId}</div>
  ),
}));
vi.mock("@/app/ui/calendar/MoonReferenceForm", () => ({
  default: () => <form data-testid="moon-form" />,
}));
vi.mock("@/app/ui/calendar/WorldDate", () => ({
  default: ({
    universalDay,
    system,
  }: {
    universalDay: number;
    system: { name: string };
  }) => (
    <span data-testid="moon-date">
      {universalDay} in {system.name}
    </span>
  ),
}));

import CalendarPage, { generateMetadata } from "./page";

const render_ = async (system = "dnd5e") =>
  render(
    await CalendarPage({
      params: Promise.resolve({ locale: "it", system }),
      searchParams: Promise.resolve({}),
    })
  );

describe("world calendar page (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDateSystems.mockResolvedValue([
      universalCountFixture,
      humanCountFixture,
    ]);
    fetchCalendarSettings.mockResolvedValue({ moonNewMoonDay: null });
    readDisplayDateSystemId.mockResolvedValue(null);
  });

  it("titles the page from the calendar catalogue", async () => {
    expect((await generateMetadata()).title).toBe("calendar.systems.title");
  });

  it("hands every system to the panel, in the order read", async () => {
    await render_();

    expect(screen.getByTestId("panel")).toHaveTextContent(
      `${universalCountFixture.name}${humanCountFixture.name}`
    );
  });

  it("says the moon is unset when no reference day exists", async () => {
    await render_();

    expect(screen.getByText(/calendar\.moon\.notSet/)).toBeInTheDocument();
    expect(screen.queryByTestId("moon-date")).not.toBeInTheDocument();
  });

  it("shows the reference new moon in the viewer's chosen system", async () => {
    fetchCalendarSettings.mockResolvedValue({ moonNewMoonDay: 2_106_055 });
    readDisplayDateSystemId.mockResolvedValue(humanCountFixture.id);

    await render_();

    expect(screen.getByTestId("moon-date")).toHaveTextContent(
      `2106055 in ${humanCountFixture.name}`
    );
    expect(screen.getByTestId("toggle")).toHaveTextContent(
      String(humanCountFixture.id)
    );
  });

  it("falls back to the world default with no viewer preference", async () => {
    fetchCalendarSettings.mockResolvedValue({ moonNewMoonDay: 0 });

    await render_();

    expect(screen.getByTestId("moon-date")).toHaveTextContent(
      `0 in ${universalCountFixture.name}`
    );
  });

  it("is a 404 under an unknown game system, as every shared page", async () => {
    await expect(render_("gurps")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
