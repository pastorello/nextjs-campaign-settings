import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TableSkeleton } from "./skeletons";
import listConfig from "@/app/lib/config/listConfig";
import PageType from "@/app/lib/definitions/types/PageType";

/**
 * The loading placeholder used to be the Next.js Learn tutorial's invoices
 * table, headed "Customer · Email · Amount · Date · Status · Edit". Those
 * strings were in the accessibility tree of every list page.
 */
const TUTORIAL_WORDS = ["Customer", "Email", "Amount", "Date", "Status"];

describe("TableSkeleton", () => {
  it("carries no tutorial vocabulary", () => {
    const { container } = render(<TableSkeleton />);

    for (const word of TUTORIAL_WORDS) {
      expect(container.textContent).not.toContain(word);
    }
  });

  it("says nothing at all to assistive technology", () => {
    const { container } = render(<TableSkeleton />);

    // A placeholder is decorative: the real table announces itself when it
    // arrives. Hiding it also keeps role queries from matching the skeleton's
    // headers instead of the real ones while a page streams.
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryAllByRole("columnheader")).toHaveLength(0);
    expect(container.textContent).toBe("");
  });

  it.each([PageType.Spell, PageType.Png, PageType.Deity, PageType.MagicItem])(
    "matches the real %s table's column count",
    (pageType) => {
      const { container } = render(<TableSkeleton pageType={pageType} />);

      // name + the domain's columns + actions
      const expected = listConfig[pageType].columns.length + 2;

      expect(container.querySelectorAll("thead th")).toHaveLength(expected);
      expect(
        container.querySelectorAll("tbody tr:first-child td")
      ).toHaveLength(expected);
    }
  );

  it("falls back to a plausible width when given no page type", () => {
    const { container } = render(<TableSkeleton />);

    expect(container.querySelectorAll("thead th").length).toBeGreaterThan(0);
  });
});
