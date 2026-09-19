import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
let system = "dnd5e";
vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => system }));

import NavLinks from "./nav-links";

beforeEach(() => {
  system = "dnd5e";
});

// SPEC-021 T1: with a second system, the sidebar must not offer a catalogue
// that is a 404 under the URL's system (ADR-0013 rule 4).
describe("NavLinks under a system", () => {
  it("lists the 5e catalogues under dnd5e", () => {
    pathname = "/dashboard/dnd5e";
    render(<NavLinks />);

    for (const key of ["spells", "magicItems", "treasure"]) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });

  it("leaves the 5e catalogues out under daggerheart and keeps the world", () => {
    system = "daggerheart";
    pathname = "/dashboard/daggerheart";
    render(<NavLinks />);

    for (const key of ["spells", "magicItems", "treasure"]) {
      expect(screen.queryByText(key)).not.toBeInTheDocument();
    }
    for (const key of [
      "search",
      "home",
      "campaign",
      "deities",
      "geography",
      "npc",
      "factions",
    ]) {
      expect(screen.getByLabelText(key)).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/dashboard\/daggerheart/)
      );
    }
  });

  // SPEC-021 T2/T3: the Daggerheart catalogues, under daggerheart alone.
  it("lists domains and domain cards, with admin links, under daggerheart", () => {
    system = "daggerheart";
    pathname = "/dashboard/daggerheart";
    render(<NavLinks />);

    expect(screen.getByLabelText("dhDomains")).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/domains"
    );
    expect(screen.getByLabelText("dhDomainCards")).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/domain-cards"
    );
    expect(screen.getByLabelText("manage:dhdomaincards")).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/admin/domain-cards"
    );
  });

  it("leaves the Daggerheart catalogues out under dnd5e", () => {
    pathname = "/dashboard/dnd5e";
    render(<NavLinks />);

    expect(screen.queryByText("dhDomains")).not.toBeInTheDocument();
    expect(screen.queryByText("dhDomainCards")).not.toBeInTheDocument();
  });

  it("lists classes and subclasses under daggerheart only (SPEC-021 T4–T6)", () => {
    system = "daggerheart";
    pathname = "/dashboard/daggerheart";
    const { unmount } = render(<NavLinks />);

    // Classes have a public list since T6; subclasses are shown on their
    // class's page and keep the admin list.
    expect(screen.getByLabelText("dhClasses")).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/classes"
    );
    expect(screen.getByLabelText("dhSubclasses")).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/admin/subclasses"
    );
    unmount();

    system = "dnd5e";
    pathname = "/dashboard/dnd5e";
    render(<NavLinks />);
    expect(screen.queryByText("dhClasses")).not.toBeInTheDocument();
    expect(screen.queryByText("dhSubclasses")).not.toBeInTheDocument();
  });
});

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
