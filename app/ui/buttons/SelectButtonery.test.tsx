import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/spells",
  useSearchParams: () => searchParams,
}));

import SelectButtonery from "./SelectButtonery";

describe("SelectButtonery", () => {
  it("renders an 'all' button plus one per option by default", () => {
    searchParams = new URLSearchParams();
    render(<SelectButtonery fieldKey={SpellMetaField.classes} />);

    expect(
      screen.getByRole("button", { name: "common.filters.all" })
    ).toBeInTheDocument();
    // classes.ts declares several classes; spot-check one rather than every
    // label, which would just restate the config file.
    expect(
      screen.getByRole("button", { name: "spells.classes.bard" })
    ).toBeInTheDocument();
  });

  it("omits the 'all' button when omitAllButton is set", () => {
    searchParams = new URLSearchParams();
    render(<SelectButtonery fieldKey={SpellMetaField.classes} omitAllButton />);

    expect(
      screen.queryByRole("button", { name: "common.filters.all" })
    ).not.toBeInTheDocument();
  });

  it("clicking an option filters by its value via the URL", () => {
    searchParams = new URLSearchParams();
    render(<SelectButtonery fieldKey={SpellMetaField.classes} />);

    fireEvent.click(
      screen.getByRole("button", { name: "spells.classes.bard" })
    );

    expect(replace).toHaveBeenCalledWith("/dashboard/spells?classes=0&page=1");
  });

  it("clicking 'all' clears the filter", () => {
    searchParams = new URLSearchParams({ classes: "0" });
    render(<SelectButtonery fieldKey={SpellMetaField.classes} />);

    fireEvent.click(screen.getByRole("button", { name: "common.filters.all" }));

    expect(replace).toHaveBeenCalledWith("/dashboard/spells?");
  });
});
