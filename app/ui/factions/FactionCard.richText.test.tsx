import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import { buildCreateSchema } from "@/app/lib/data/validation/buildEntitySchema";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import RecordLinkContext from "@/app/ui/richText/RecordLinkContext";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import FactionCard from "./FactionCard";

/**
 * SPEC-019 T7: the server half of `e2e/rich-text.spec.ts`'s chain, without a
 * database — what the editor emits for a bold word, a list and a record link
 * goes through the faction create schema (the `RichText` validator, which
 * sanitises) and comes out of `FactionCard` still formatted.
 *
 * Written while diagnosing that spec's missing `<strong>` on CI (2026-09-19):
 * this chain was sound; the spec's keyboard steps had raced ProseMirror's
 * selection sync and saved a description with the bold word deleted.
 */
const EDITOR_HTML =
  "<p><strong>Powerful</strong> and secretive.</p>" +
  "<ul><li><p>Recruits from the docks</p></li>" +
  '<li><p>Guards the sealed <a data-record-domain="npc" data-record-id="7">archive</a></p></li></ul>';

describe("a faction's formatted description, from editor output to card", () => {
  it("keeps the bold word, the list and the record link", () => {
    const parsed = buildCreateSchema(PageType.Faction).parse({
      name: "The Harpers",
      description: EDITOR_HTML,
    }) as Omit<Faction, "id">;

    expect(parsed.description).toContain("<strong>Powerful</strong>");

    // A stand-in for the page's resolver (T5, tested on its own): it only
    // has to show that the link reached the card with its domain and id.
    render(
      <RecordLinkContext.Provider
        value={(domain, id, children) => (
          <a href={`/${domain}/${id}`}>{children}</a>
        )}
      >
        <FactionCard cardItem={{ id: 1, ...parsed }} roster={[]} />
      </RecordLinkContext.Provider>
    );
    fireEvent.click(screen.getByRole("button", { name: /The Harpers/ }));

    const bold = screen.getByText("Powerful");
    expect(bold.tagName).toBe("STRONG");
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Recruits from the docks",
      "Guards the sealed archive",
    ]);
    expect(screen.getByRole("link", { name: "archive" })).toHaveAttribute(
      "href",
      "/npc/7"
    );
  });
});
