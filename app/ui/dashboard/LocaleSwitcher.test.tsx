import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LocaleSwitcher from "./LocaleSwitcher";

const replace = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "it",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/dashboard/spells",
  useRouter: () => ({ replace }),
}));

describe("LocaleSwitcher", () => {
  it("lists both locales by their own endonym", () => {
    render(<LocaleSwitcher />);

    expect(
      screen.getByRole("option", { name: "Italiano" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
  });

  it("defaults to the active locale", () => {
    render(<LocaleSwitcher />);

    expect(screen.getByRole("combobox")).toHaveValue("it");
  });

  it("navigates to the same path under the chosen locale", () => {
    render(<LocaleSwitcher />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "en" },
    });

    expect(replace).toHaveBeenCalledWith(
      { pathname: "/dashboard/spells", query: {} },
      { locale: "en" }
    );
  });
});
