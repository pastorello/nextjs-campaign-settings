import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const clearSearchParams = vi.fn();
vi.mock("@/app/lib/actions/search/useClearSearchParams", () => ({
  useClearSearchParams: () => clearSearchParams,
}));

import { ResetButton } from "./ResetSearchButton";

describe("ResetButton", () => {
  it("clears the search params when clicked", () => {
    render(<ResetButton />);

    fireEvent.click(screen.getByText("reset"));

    expect(clearSearchParams).toHaveBeenCalled();
  });
});
