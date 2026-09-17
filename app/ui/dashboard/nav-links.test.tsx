import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${values.section as string}` : key,
}));

// next-intl's usePathname: the locale is already stripped.
let pathname = "/dashboard/dnd5e";
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname,
  Link: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
}));
vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

import NavLinks from "./nav-links";

describe("NavLinks", () => {
  it("renders a link and label for every declared nav item", () => {
    pathname = "/dashboard/dnd5e";
    render(<NavLinks />);

    expect(screen.getByText("home")).toBeInTheDocument();
    expect(screen.getByText("deities")).toBeInTheDocument();
    expect(screen.getByText("spells")).toBeInTheDocument();
    expect(screen.getByText("search")).toBeInTheDocument();
  });

  it("links the search entry to /dashboard/dnd5e/search, reachable from any dashboard page (SPEC-011 T3)", () => {
    pathname = "/dashboard/dnd5e/admin/spells";
    render(<NavLinks />);

    expect(screen.getByText("search").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/search"
    );
  });

  it("renders a named admin link only for domains that declare one", () => {
    pathname = "/dashboard/dnd5e";
    render(<NavLinks />);

    // "geography" has no admin route in the config; the other domains do.
    expect(
      screen.queryByLabelText(/manage:geography/i)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("manage:spells")).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/admin/spells"
    );
  });

  // TD-114: the label text is `hidden` below `md`, and `display: none`
  // content has no accessible name — so an icon-only tile on a phone
  // announced nothing at all. The explicit aria-label fixes that at every
  // width, not just below `md`.
  it("gives every nav link an accessible name, not just the admin pencil links", () => {
    pathname = "/dashboard/dnd5e";
    render(<NavLinks />);

    expect(screen.getByLabelText("spells").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/spells"
    );
  });

  it("highlights the current page's link, matching either the public or admin path", () => {
    pathname = "/dashboard/dnd5e/admin/spells";
    render(<NavLinks />);

    expect(screen.getByText("spells").closest("div.rounded-md")).toHaveClass(
      "bg-sky-100"
    );
  });
});
