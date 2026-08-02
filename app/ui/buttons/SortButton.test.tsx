import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SortOrder from "@/app/lib/definitions/types/SortOrder";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${values.field as string}` : key,
}));

import SortButton from "./SortButton";

describe("SortButton", () => {
  it("names itself after the column it sorts, for screen readers", () => {
    render(
      <SortButton
        sortOrder={SortOrder.asc}
        onClick={vi.fn()}
        isActive={false}
        label="Level"
      />
    );

    expect(
      screen.getByRole("button", { name: "ariaLabel:level" })
    ).toBeInTheDocument();
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(
      <SortButton
        sortOrder={SortOrder.asc}
        onClick={onClick}
        isActive={false}
        label="Level"
      />
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalled();
  });
});
