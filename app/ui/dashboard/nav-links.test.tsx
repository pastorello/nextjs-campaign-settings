import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${values.section as string}` : key,
}));

let pathname = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

import NavLinks from "./nav-links";

describe("NavLinks", () => {
  it("renders a link and label for every declared nav item", () => {
    pathname = "/dashboard";
    render(<NavLinks />);

    expect(screen.getByText("home")).toBeInTheDocument();
    expect(screen.getByText("deities")).toBeInTheDocument();
    expect(screen.getByText("spells")).toBeInTheDocument();
  });

  it("renders a named admin link only for domains that declare one", () => {
    pathname = "/dashboard";
    render(<NavLinks />);

    // "geography" has no admin route in the config; the other domains do.
    expect(
      screen.queryByLabelText(/manage:geography/i)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("manage:spells")).toHaveAttribute(
      "href",
      "/dashboard/admin/spells"
    );
  });

  it("highlights the current page's link, matching either the public or admin path", () => {
    pathname = "/dashboard/admin/spells";
    render(<NavLinks />);

    expect(screen.getByText("spells").closest("div.w-full")).toHaveClass(
      "bg-sky-100"
    );
  });
});
