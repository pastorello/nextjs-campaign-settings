import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SystemSwitcher from "./SystemSwitcher";

const { push, current } = vi.hoisted(() => ({
  push: vi.fn(),
  current: { system: "dnd5e", pathname: "/dashboard/dnd5e/geography" },
}));

vi.mock("@/app/lib/hooks/useGameSystem", () => ({
  default: () => current.system,
}));

// Each namespace's translator returns `<namespace>.<key>`, so a test can tell
// the system label from the compatibility line.
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("place=12"),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => current.pathname,
  useRouter: () => ({ push }),
}));

describe("SystemSwitcher", () => {
  beforeEach(() => {
    push.mockClear();
    current.system = "dnd5e";
    current.pathname = "/dashboard/dnd5e/geography";
  });

  // SPEC-021 T1: Daggerheart joined `GAME_SYSTEMS`, so the switch that was
  // shown disabled while dnd5e stood alone (2026-09-18) is live.
  it("is enabled and lists both systems", () => {
    render(<SystemSwitcher />);

    const select = screen.getByRole("combobox", {
      name: "common.nav.gameSystem",
    });
    expect(select).toBeEnabled();
    expect(select).toHaveValue("dnd5e");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["gameSystems.dnd5e", "gameSystems.daggerheart"]);
  });

  it("navigates to the same shared page under the chosen system", () => {
    render(<SystemSwitcher />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "daggerheart" },
    });

    expect(push).toHaveBeenCalledWith(
      "/dashboard/daggerheart/geography?place=12"
    );
  });

  it("sends a 5e catalogue page to Daggerheart's dashboard home", () => {
    current.pathname = "/dashboard/dnd5e/spells";
    render(<SystemSwitcher />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "daggerheart" },
    });

    expect(push).toHaveBeenCalledWith("/dashboard/daggerheart");
  });

  // SPEC-018 §5.3: "Daggerheart™ Compatible" where the system is named.
  it("shows the compatibility line under Daggerheart, as the select's description", () => {
    current.system = "daggerheart";
    current.pathname = "/dashboard/daggerheart";
    render(<SystemSwitcher />);

    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "gameSystemCompatibility.daggerheart"
    );
  });

  it("shows no compatibility line under 5e", () => {
    render(<SystemSwitcher />);

    expect(screen.getByRole("combobox")).not.toHaveAttribute(
      "aria-describedby"
    );
    expect(
      screen.queryByText(/gameSystemCompatibility/)
    ).not.toBeInTheDocument();
  });
});
