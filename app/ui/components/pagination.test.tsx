import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${values.number as string}` : key,
}));

let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/spells",
  useSearchParams: () => searchParams,
}));

import Pagination from "./pagination";

describe("Pagination", () => {
  it("defaults to page 1 when there is no page search param", () => {
    searchParams = new URLSearchParams();
    render(<Pagination totalPages={5} />);

    // Page 1 is rendered as a plain div (isActive), not a link.
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("1").tagName).toBe("DIV");
  });

  it("links every other page number to the URL carrying its page param", () => {
    searchParams = new URLSearchParams({ page: "1" });
    render(<Pagination totalPages={3} />);

    const page2 = screen.getByText("2");
    expect(page2.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/spells?page=2"
    );
  });

  it("disables the left arrow on the first page", () => {
    // A disabled arrow renders as an inert <div>, not a <Link> — so it
    // carries no aria-label of its own (only the enabled variant does).
    searchParams = new URLSearchParams({ page: "1" });
    render(<Pagination totalPages={5} />);

    expect(screen.queryByLabelText("previous")).not.toBeInTheDocument();
    expect(screen.getByLabelText("next")).toBeInTheDocument();
  });

  it("disables the right arrow on the last page", () => {
    searchParams = new URLSearchParams({ page: "5" });
    render(<Pagination totalPages={5} />);

    expect(screen.queryByLabelText("next")).not.toBeInTheDocument();
    expect(screen.getByLabelText("previous")).toBeInTheDocument();
  });

  it("enables both arrows on a middle page", () => {
    searchParams = new URLSearchParams({ page: "3" });
    render(<Pagination totalPages={5} />);

    expect(screen.getByLabelText("previous").tagName).toBe("A");
    expect(screen.getByLabelText("next").tagName).toBe("A");
  });

  it("renders an ellipsis as inert text rather than a link", () => {
    searchParams = new URLSearchParams({ page: "1" });
    render(<Pagination totalPages={20} />);

    const ellipsis = screen.getAllByText("...")[0];
    expect(ellipsis?.tagName).toBe("DIV");
  });
});
