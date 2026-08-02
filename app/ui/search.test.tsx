import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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

import Search from "./search";

describe("Search", () => {
  it("pre-fills the field from the current query param", () => {
    searchParams = new URLSearchParams({ query: "fireball" });
    render(<Search placeholder="Search spells" />);

    expect(screen.getByLabelText("label")).toHaveValue("fireball");
  });

  it("writes the query param and resets the page on input", () => {
    searchParams = new URLSearchParams();
    render(<Search placeholder="Search spells" />);

    fireEvent.change(screen.getByLabelText("label"), {
      target: { value: "ice storm" },
    });

    expect(replace).toHaveBeenCalledWith(
      "/dashboard/spells?query=ice+storm&page=1"
    );
  });

  it("removes the query param when the field is cleared", () => {
    searchParams = new URLSearchParams({ query: "fireball", page: "2" });
    render(<Search placeholder="Search spells" />);

    fireEvent.change(screen.getByLabelText("label"), {
      target: { value: "" },
    });

    expect(replace).toHaveBeenCalledWith("/dashboard/spells?page=2");
  });
});
