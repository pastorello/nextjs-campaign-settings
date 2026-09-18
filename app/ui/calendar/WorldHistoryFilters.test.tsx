import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorldHistoryQuery from "@/app/lib/definitions/interfaces/calendar/WorldHistoryQuery";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/en/dashboard/dnd5e/world/history",
  useSearchParams: () => searchParams,
}));

import WorldHistoryFilters from "./WorldHistoryFilters";

// Headless UI's Listbox measures itself with ResizeObserver on selection,
// which jsdom does not implement — same stub as `LootForm.test.tsx`.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const noFilters: WorldHistoryQuery = {
  place: null,
  npc: null,
  deity: null,
  faction: null,
  page: 1,
};

function renderFilters(query = noFilters) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <WorldHistoryFilters
        query={query}
        linkOptions={{
          zones: [{ value: 9, label: "Kang" }],
          npcs: [],
          deities: [],
          factions: [],
        }}
      />
    </NextIntlClientProvider>
  );
}

describe("WorldHistoryFilters (SPEC-014 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams("page=3");
  });

  it("filters by a place through the URL, back on the first page", () => {
    renderFilters();

    fireEvent.click(screen.getAllByRole("button")[0]!);
    fireEvent.click(screen.getByRole("option", { name: "Kang" }));

    expect(replace).toHaveBeenCalledWith(
      "/en/dashboard/dnd5e/world/history?place=9"
    );
  });

  it("offers to clear the filters only when one is set", () => {
    renderFilters();
    expect(
      screen.queryByRole("button", { name: en.calendar.history.filters.clear })
    ).not.toBeInTheDocument();
  });

  it("clears every filter", () => {
    searchParams = new URLSearchParams("place=9&npc=2");
    renderFilters({ ...noFilters, place: 9, npc: 2 });

    fireEvent.click(
      screen.getByRole("button", { name: en.calendar.history.filters.clear })
    );

    expect(replace).toHaveBeenCalledWith("/en/dashboard/dnd5e/world/history");
  });
});
