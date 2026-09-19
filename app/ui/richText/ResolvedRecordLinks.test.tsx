import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ system: "dnd5e" }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { fetchResolution } = vi.hoisted(() => ({ fetchResolution: vi.fn() }));
vi.mock("@/app/lib/data/richText/fetchRecordLinkResolution", () => ({
  default: fetchResolution,
}));

import renderRichText from "@/app/lib/utils/data/renderRichText";
import ResolvedRecordLinks from "./ResolvedRecordLinks";

const link = (id: number, text: string) =>
  `<a data-record-domain="npc" data-record-id="${id}">${text}</a>`;

describe("ResolvedRecordLinks (SPEC-019 T5)", () => {
  it("links what resolved and leaves a deleted record as text", async () => {
    const value = `<p>${link(4, "Mira")} and ${link(5, "Tobin")}</p>`;
    fetchResolution.mockResolvedValue({
      targets: { "npc:4": "Mira" },
      deleted: ["npc:5"],
    });

    render(
      await ResolvedRecordLinks({
        values: [value],
        system: "dnd5e",
        children: renderRichText(value),
      })
    );

    expect(fetchResolution).toHaveBeenCalledWith([value], "dnd5e");
    expect(screen.getByRole("link", { name: "Mira" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Tobin" })).toBeNull();
    expect(screen.getByText(/Tobin/)).toBeVisible();
  });
});
