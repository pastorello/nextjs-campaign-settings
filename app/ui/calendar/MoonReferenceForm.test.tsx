import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { universalCountFixture } from "@/app/lib/calendar/dateSystemFixtures";

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
      const full = namespace ? `${namespace}.${key}` : key;
      return values ? `${full} ${JSON.stringify(values)}` : full;
    },
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

const setMoonReferenceDay = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/setMoonReferenceDay", () => ({
  default: (...args: unknown[]) => setMoonReferenceDay(...args),
}));

import MoonReferenceForm from "./MoonReferenceForm";

const systems = [universalCountFixture];

describe("MoonReferenceForm (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMoonReferenceDay.mockResolvedValue({ ok: true });
  });

  it("saves the typed date as a universal day", async () => {
    render(
      <MoonReferenceForm
        systems={systems}
        moonNewMoonDay={null}
        displaySystemId={1}
      />
    );

    // Universal year 1, 1st of the first month: day 365.
    fireEvent.change(screen.getByLabelText("calendar.input.year"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("calendar.input.day"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByText("common.form.save"));

    await waitFor(() =>
      expect(setMoonReferenceDay).toHaveBeenCalledWith({ moonNewMoonDay: 365 })
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("does not submit an empty date, which would clear the reference", () => {
    render(
      <MoonReferenceForm
        systems={systems}
        moonNewMoonDay={null}
        displaySystemId={1}
      />
    );

    fireEvent.click(screen.getByText("common.form.save"));

    expect(setMoonReferenceDay).not.toHaveBeenCalled();
  });

  it("offers clear only while a reference is set, and clears with null", async () => {
    const { rerender } = render(
      <MoonReferenceForm
        systems={systems}
        moonNewMoonDay={null}
        displaySystemId={1}
      />
    );
    expect(
      screen.queryByText("calendar.moon.clearButton")
    ).not.toBeInTheDocument();

    rerender(
      <MoonReferenceForm
        systems={systems}
        moonNewMoonDay={10}
        displaySystemId={1}
      />
    );
    fireEvent.click(screen.getByText("calendar.moon.clearButton"));

    await waitFor(() =>
      expect(setMoonReferenceDay).toHaveBeenCalledWith({
        moonNewMoonDay: null,
      })
    );
  });
});
