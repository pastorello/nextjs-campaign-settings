import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${values.field as string}` : key,
}));

// The debounce is an implementation detail of how fast repeated filter
// clicks reach the URL, not something this suite is testing — mocked to a
// synchronous passthrough so assertions don't need fake timers.
vi.mock("use-debounce", () => ({
  useDebouncedCallback: (fn: (...args: unknown[]) => void) => fn,
}));

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/spells",
  useSearchParams: () => searchParams,
}));

import SortableHeader from "./SortableHeader";

// Headless UI's Listbox measures itself with ResizeObserver on selection,
// which jsdom does not implement — the same gap Select's own suite avoids by
// never actually choosing an option. This suite does, to cover onFilter.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("SortableHeader", () => {
  it("renders a plain label with no filter control when isFiltrable is false", () => {
    searchParams = new URLSearchParams();
    render(<SortableHeader label="Name" fieldKey="name" isFiltrable={false} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByTestId("form-select")).not.toBeInTheDocument();
  });

  it("renders a filter select for a filtrable field with declared options", () => {
    searchParams = new URLSearchParams();
    render(
      <SortableHeader
        label="Classes"
        fieldKey={SpellMetaField.classes}
        isFiltrable={true}
      />
    );

    expect(screen.getByTestId("form-select")).toBeInTheDocument();
  });

  it("hides the sort button when isSortable is false", () => {
    searchParams = new URLSearchParams();
    render(
      <SortableHeader
        label="Classes"
        fieldKey={SpellMetaField.classes}
        isSortable={false}
      />
    );

    expect(screen.queryByRole("button", { name: /ariaLabel/ })).toBeNull();
  });

  it("clicking the sort button writes sort and fieldSort params to the URL", () => {
    searchParams = new URLSearchParams();
    render(
      <SortableHeader label="Classes" fieldKey={SpellMetaField.classes} />
    );

    fireEvent.click(screen.getByRole("button", { name: /ariaLabel/ }));

    expect(replace).toHaveBeenCalledWith(expect.stringContaining("sort=desc"));
    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining(
        `fieldSort=${encodeURIComponent(JSON.stringify({ classes: "desc" }))}`
      )
    );
  });

  it("selecting a filter option writes the field's param and resets the page", () => {
    searchParams = new URLSearchParams();
    render(
      <SortableHeader label="Classes" fieldKey={SpellMetaField.classes} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Classes" }));
    fireEvent.click(screen.getByText("spells.classes.bard"));

    expect(replace).toHaveBeenCalledWith("/dashboard/spells?classes=0&page=1");
  });
});
