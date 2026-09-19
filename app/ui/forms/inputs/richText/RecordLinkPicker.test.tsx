import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchAllDomainsResult } from "@/app/lib/data/search/searchAllDomains";

vi.mock("next/navigation", () => ({
  useParams: () => ({ system: "dnd5e" }),
}));

const { searchRecordLinks } = vi.hoisted(() => ({
  searchRecordLinks: vi.fn(),
}));
vi.mock("@/app/lib/data/search/searchRecordLinks", () => ({
  default: searchRecordLinks,
}));

import RecordLinkPicker from "./RecordLinkPicker";

const group = (...items: { id: number; name: string }[]) => ({
  total: items.length,
  items,
});

const result = (
  groups: Partial<SearchAllDomainsResult>
): SearchAllDomainsResult => ({
  spells: group(),
  magicItems: group(),
  npc: group(),
  deities: group(),
  factions: group(),
  places: group(),
  dhDomains: group(),
  dhDomainCards: group(),
  dhClasses: group(),
  dhSubclasses: group(),
  ...groups,
});

function renderPicker() {
  const onChoose = vi.fn();
  render(<RecordLinkPicker isOpen setIsOpen={vi.fn()} onChoose={onChoose} />);
  return { onChoose, input: screen.getByLabelText("searchLabel") };
}

describe("RecordLinkPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prompts before anything is typed, and does not search", () => {
    renderPicker();

    expect(screen.getByText("prompt")).toBeInTheDocument();
    expect(searchRecordLinks).not.toHaveBeenCalled();
  });

  it("searches under the route's system and groups results by domain, in search-page order", async () => {
    searchRecordLinks.mockResolvedValue(
      result({
        places: group({ id: 9, name: "Mirafiore" }),
        npc: group({ id: 4, name: "Mira" }, { id: 5, name: "Miranda" }),
      })
    );
    const { input } = renderPicker();

    fireEvent.change(input, { target: { value: "mira" } });

    const headings = await screen.findAllByRole("heading", { level: 3 });
    expect(searchRecordLinks).toHaveBeenCalledWith("mira", "dnd5e");
    expect(headings.map((h) => h.textContent)).toEqual(["npc", "places"]);
    const npcGroup = screen.getByRole("region", { name: "npc" });
    expect(
      within(npcGroup)
        .getAllByRole("button")
        .map((b) => b.textContent)
    ).toEqual(["Mira", "Miranda"]);
  });

  it("hands the chosen record's domain and id to the editor", async () => {
    searchRecordLinks.mockResolvedValue(
      result({ npc: group({ id: 4, name: "Mira" }) })
    );
    const { input, onChoose } = renderPicker();
    fireEvent.change(input, { target: { value: "mira" } });

    fireEvent.click(await screen.findByRole("button", { name: "Mira" }));

    expect(onChoose).toHaveBeenCalledWith({ domain: "npc", id: 4 });
  });

  it("offers the Daggerheart catalogues search returns, after the world's (SPEC-021 T7)", async () => {
    searchRecordLinks.mockResolvedValue(
      result({
        dhSubclasses: group({ id: 11, name: "Lantern Warden" }),
        dhClasses: group({ id: 7, name: "Lamplighter" }),
        places: group({ id: 9, name: "Lantern Hill" }),
      })
    );
    const { input, onChoose } = renderPicker();
    fireEvent.change(input, { target: { value: "lan" } });

    const headings = await screen.findAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "places",
      "dhClasses",
      "dhSubclasses",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Lamplighter" }));
    expect(onChoose).toHaveBeenCalledWith({ domain: "dhClasses", id: 7 });
  });

  it("says when nothing matches", async () => {
    searchRecordLinks.mockResolvedValue(result({}));
    const { input } = renderPicker();

    fireEvent.change(input, { target: { value: "zzz" } });

    expect(await screen.findByText("noMatches")).toBeInTheDocument();
  });

  it("says when the search fails", async () => {
    searchRecordLinks.mockRejectedValue(new Error("boom"));
    const { input } = renderPicker();

    fireEvent.change(input, { target: { value: "mira" } });

    expect(await screen.findByText("error")).toBeInTheDocument();
  });
});
