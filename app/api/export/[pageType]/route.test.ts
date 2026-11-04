import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import PageType from "@/app/lib/definitions/types/PageType";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));
// The setup file's mock has only `useTranslations`; the route needs the real,
// pure `hasLocale`.
vi.mock("next-intl", async (importOriginal) => importOriginal());

const { fetchAllListItems, fetchOptionBundle } = vi.hoisted(() => ({
  fetchAllListItems: vi.fn(),
  fetchOptionBundle: vi.fn(),
}));
vi.mock("@/app/lib/data/export/fetchAllListItems", () => ({
  default: fetchAllListItems,
}));
vi.mock("@/app/lib/data/options/fetchOptionBundle", () => ({
  default: fetchOptionBundle,
}));

import { GET } from "./route";

const call = (pageType: string, query = "") =>
  GET(new Request(`http://localhost/api/export/${pageType}${query}`), {
    params: Promise.resolve({ pageType }),
  });

const asDm = () =>
  vi.mocked(auth).mockResolvedValue({
    user: { id: "1", name: "dm", role: "dm" },
  } as never);

describe("GET /api/export/[pageType] (SPEC-033 T1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asDm();
    vi.mocked(getTranslations).mockResolvedValue(
      ((key: string) => key) as never
    );
    fetchOptionBundle.mockResolvedValue(undefined);
    fetchAllListItems.mockResolvedValue([
      { id: 3, name: "The Hand" },
      { id: 4, name: "Città Nera" },
    ]);
  });

  it("refuses an unauthenticated request, reading nothing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    expect((await call(PageType.Faction)).status).toBe(401);
    expect(fetchAllListItems).not.toHaveBeenCalled();
  });

  it("refuses a player, reading nothing", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "2", name: "p", role: "player" },
    } as never);

    expect((await call(PageType.Faction, "?id=3")).status).toBe(403);
    expect(fetchAllListItems).not.toHaveBeenCalled();
  });

  it("answers 404 for something that is not a domain", async () => {
    expect((await call("campaigns")).status).toBe(404);
    expect(fetchAllListItems).not.toHaveBeenCalled();
  });

  it("exports the list under its filter as a Markdown file", async () => {
    const response = await call(
      PageType.Faction,
      "?query=hand&sort=desc&locale=en"
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8"
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="factions.md"'
    );
    expect(await response.text()).toBe("# The Hand\n\n---\n\n# Città Nera\n");
    // The locale picks the catalogue; it is not a filter.
    expect(fetchAllListItems).toHaveBeenCalledWith(PageType.Faction, {
      query: "hand",
      sort: "desc",
    });
    expect(getTranslations).toHaveBeenCalledWith({ locale: "en" });
  });

  it("exports one record, named after it", async () => {
    const response = await call(PageType.Faction, "?id=4");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="citta-nera.md"'
    );
    expect(await response.text()).toBe("# Città Nera\n");
    expect(fetchAllListItems).toHaveBeenCalledWith(PageType.Faction, {
      id: "4",
    });
  });

  it("answers 404 for a record the list does not hold", async () => {
    expect((await call(PageType.Faction, "?id=9")).status).toBe(404);
  });

  it("refuses an id that is not one", async () => {
    expect((await call(PageType.Faction, "?id=x")).status).toBe(400);
    expect(fetchAllListItems).not.toHaveBeenCalled();
  });

  it("falls back to the default locale for one it does not know", async () => {
    await call(PageType.Faction, "?locale=fr");

    expect(getTranslations).toHaveBeenCalledWith({ locale: "it" });
  });

  it("answers 500, not a half-written file, when the read fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchAllListItems.mockRejectedValue(new Error("boom"));

    expect((await call(PageType.Faction)).status).toBe(500);
  });
});
