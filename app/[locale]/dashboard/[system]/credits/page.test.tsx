import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import en from "@/messages/en.json";
import it_ from "@/messages/it.json";

// The real catalogues, through next-intl's own translator, so the page is
// tested with `t.rich` doing what it does in production. `vitest.setup.ts`
// replaces `next-intl` with a key-returning stub, hence `importActual`.
const { createTranslator } =
  await vi.importActual<typeof import("next-intl")>("next-intl");

let current: { locale: string; messages: typeof en } = {
  locale: "en",
  messages: en,
};
vi.mock("next-intl/server", () => ({
  getTranslations: (namespace: "credits") =>
    Promise.resolve(createTranslator({ ...current, namespace })),
}));

import CreditsPage from "./page";

// The statement the licence mandates, as the repository's `NOTICE.md` has it.
// The page and the file are two copies of one text, and nothing else would
// notice if one were edited.
const noticeStatement = readFileSync(
  path.join(process.cwd(), "NOTICE.md"),
  "utf8"
).match(/^This work includes material from the .*$/m)?.[0];

describe("CreditsPage", () => {
  it("has a statement in NOTICE.md to compare against", () => {
    expect(noticeStatement).toContain("System Reference Document 5.2.1");
  });

  it.each([
    ["en", en, "Credits"],
    ["it", it_, "Crediti"],
  ])(
    "shows NOTICE.md's SRD 5.2.1 statement, word for word, in the %s catalogue",
    async (locale, messages, title) => {
      current = { locale, messages };

      const { container } = render(await CreditsPage());

      expect(
        screen.getByRole("heading", { level: 1, name: title })
      ).toBeInTheDocument();
      const quote = container.querySelector("blockquote");
      // The licence's wording is English whatever the UI language, and says so.
      expect(quote).toHaveAttribute("lang", "en");
      expect(quote?.textContent).toBe(noticeStatement);
    }
  );

  it("links the SRD and the licence, in a new tab that cannot reach back", async () => {
    current = { locale: "en", messages: en };

    const { container } = render(await CreditsPage());

    const links = within(container.querySelector("blockquote")!).getAllByRole(
      "link"
    );
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://www.dndbeyond.com/srd",
      "https://creativecommons.org/licenses/by/4.0/legalcode",
    ]);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });
});
