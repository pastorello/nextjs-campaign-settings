import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SystemSwitcher from "./SystemSwitcher";

const { push, systems } = vi.hoisted(() => ({
  push: vi.fn(),
  // Mutable so a test can add a second system; `GAME_SYSTEMS` itself holds
  // only `dnd5e` until Daggerheart's first slice lands (ADR-0013 rule 1).
  systems: ["dnd5e"] as string[],
}));

vi.mock("@/app/lib/definitions/GameSystem", () => ({
  GAME_SYSTEMS: systems,
}));

vi.mock("@/app/lib/hooks/useGameSystem", () => ({
  default: () => "dnd5e",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("place=12"),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/dashboard/dnd5e/geography",
  useRouter: () => ({ push }),
}));

describe("SystemSwitcher", () => {
  beforeEach(() => {
    push.mockClear();
    systems.splice(0, systems.length, "dnd5e");
  });

  // The DM's answer, 2026-09-18: shown disabled, not hidden, while dnd5e is
  // the only system.
  it("is shown disabled, with an explanation, while only one system exists", () => {
    render(<SystemSwitcher />);

    const select = screen.getByRole("combobox", { name: "gameSystem" });
    expect(select).toBeDisabled();
    expect(select).toHaveValue("dnd5e");
    expect(select).toHaveAccessibleDescription("gameSystemSingle");
  });

  it("lists the systems and navigates to the same page under the chosen one", () => {
    systems.push("daggerheart");
    render(<SystemSwitcher />);

    const select = screen.getByRole("combobox", { name: "gameSystem" });
    expect(select).toBeEnabled();
    expect(select).not.toHaveAttribute("aria-describedby");
    expect(screen.getAllByRole("option")).toHaveLength(2);

    fireEvent.change(select, { target: { value: "daggerheart" } });

    expect(push).toHaveBeenCalledWith(
      "/dashboard/daggerheart/geography?place=12"
    );
  });
});
