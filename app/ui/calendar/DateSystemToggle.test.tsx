import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  humanCountFixture as human,
  universalCountFixture as universal,
} from "@/app/lib/calendar/dateSystemFixtures";
import {
  DISPLAY_DATE_SYSTEM_COOKIE,
  parseDisplayDateSystemId,
} from "@/app/lib/calendar/displayDateSystemCookie";
import DateSystemToggle from "./DateSystemToggle";

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function storedChoice(): number | null {
  const entry = document.cookie
    .split("; ")
    .find((pair) => pair.startsWith(`${DISPLAY_DATE_SYSTEM_COOKIE}=`));
  return parseDisplayDateSystemId(entry?.split("=")[1]);
}

describe("DateSystemToggle (SPEC-014 §5.2, T4)", () => {
  afterEach(() => {
    document.cookie = `${DISPLAY_DATE_SYSTEM_COOKIE}=; Path=/; Max-Age=0`;
    refresh.mockClear();
  });

  it("shows the system dates are currently shown in", () => {
    render(
      <DateSystemToggle
        systems={[universal, human]}
        selectedId={universal.id}
      />
    );

    const select = screen.getByRole("combobox", { name: "label" });
    expect(select).toHaveValue(String(universal.id));
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("stores the viewer's choice in the cookie and re-renders the page", () => {
    render(
      <DateSystemToggle
        systems={[universal, human]}
        selectedId={universal.id}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: String(human.id) },
    });

    expect(storedChoice()).toBe(human.id);
    expect(screen.getByRole("combobox")).toHaveValue(String(human.id));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("stores nothing for a system that is not in the list", () => {
    render(
      <DateSystemToggle
        systems={[universal, human]}
        selectedId={universal.id}
      />
    );

    // A select only offers its options; this simulates a stale DOM value.
    const select = screen.getByRole("combobox");
    const stray = document.createElement("option");
    stray.value = "99";
    select.appendChild(stray);
    fireEvent.change(select, { target: { value: "99" } });

    expect(storedChoice()).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });
});
