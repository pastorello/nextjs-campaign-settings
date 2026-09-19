import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useParams: () => ({ system: "dnd5e" }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { resolveRecordLinks } = vi.hoisted(() => ({
  resolveRecordLinks: vi.fn(),
}));
vi.mock("@/app/lib/data/richText/resolveRecordLinks", () => ({
  default: resolveRecordLinks,
}));

import renderRichText from "@/app/lib/utils/data/renderRichText";
import ClientResolvedRecordLinks from "./ClientResolvedRecordLinks";

const linked =
  '<p>Ask <a data-record-domain="npc" data-record-id="4">Mira</a></p>';

describe("ClientResolvedRecordLinks (SPEC-019 T5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves the links client-side and renders them as links", async () => {
    resolveRecordLinks.mockResolvedValue({
      targets: { "npc:4": "Mira" },
      deleted: [],
    });
    render(
      <ClientResolvedRecordLinks values={[linked]}>
        {renderRichText(linked)}
      </ClientResolvedRecordLinks>
    );

    expect(await screen.findByRole("link", { name: "Mira" })).toBeVisible();
    expect(resolveRecordLinks).toHaveBeenCalledWith([linked], "dnd5e");
  });

  it("sends no request when nothing links, and shows the text", () => {
    render(
      <ClientResolvedRecordLinks values={["plain", null]}>
        {renderRichText("plain")}
      </ClientResolvedRecordLinks>
    );

    expect(screen.getByText("plain")).toBeVisible();
    expect(resolveRecordLinks).not.toHaveBeenCalled();
  });

  it("renders links as text when the request fails", async () => {
    resolveRecordLinks.mockRejectedValue(new Error("offline"));
    render(
      <ClientResolvedRecordLinks values={[linked]}>
        {renderRichText(linked)}
      </ClientResolvedRecordLinks>
    );

    expect(await screen.findByText("Ask Mira")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
