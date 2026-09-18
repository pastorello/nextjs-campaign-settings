import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  humanCountFixture,
  humanCountInputFixture,
  universalCountFixture,
} from "@/app/lib/calendar/dateSystemFixtures";

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

const createDateSystem = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/createDateSystem", () => ({
  default: (...args: unknown[]) => createDateSystem(...args),
}));
const updateDateSystem = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/updateDateSystem", () => ({
  default: (...args: unknown[]) => updateDateSystem(...args),
}));
const updateUniversalDateSystem = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/updateUniversalDateSystem", () => ({
  default: (...args: unknown[]) => updateUniversalDateSystem(...args),
}));

import DateSystemForm from "./DateSystemForm";

const field = (key: string) =>
  screen.getByLabelText(`calendar.systems.fields.${key}`);
const type = (element: HTMLElement, value: string) =>
  fireEvent.change(element, { target: { value } });

describe("DateSystemForm (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a system from twelve month and seven weekday inputs", async () => {
    createDateSystem.mockResolvedValue({ ok: true });
    const onSaved = vi.fn();
    render(<DateSystemForm onCancel={vi.fn()} onSaved={onSaved} />);

    type(field("name"), humanCountInputFixture.name);
    type(field("anchorEvent"), humanCountInputFixture.anchorEvent);
    type(field("anchorYear"), String(humanCountInputFixture.anchorYear));
    type(field("afterLabel"), humanCountInputFixture.afterLabel);
    type(field("afterAbbrev"), humanCountInputFixture.afterAbbrev);
    type(field("beforeLabel"), humanCountInputFixture.beforeLabel);
    type(field("beforeAbbrev"), humanCountInputFixture.beforeAbbrev);
    humanCountInputFixture.monthNames.forEach((name, index) =>
      type(
        screen.getByLabelText(
          `calendar.systems.form.monthName {"number":${index + 1}}`
        ),
        name
      )
    );
    humanCountInputFixture.weekdayNames.forEach((name, index) =>
      type(
        screen.getByLabelText(
          `calendar.systems.form.weekdayName {"number":${index + 1}}`
        ),
        name
      )
    );
    fireEvent.click(screen.getByText("calendar.systems.form.createButton"));

    await waitFor(() =>
      expect(createDateSystem).toHaveBeenCalledWith(humanCountInputFixture)
    );
    expect(refresh).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it("shows the action's field errors and stays open", async () => {
    createDateSystem.mockResolvedValue({
      ok: false,
      errors: { monthNames: [{ key: "monthNamesCount" }] },
    });
    const onSaved = vi.fn();
    render(<DateSystemForm onCancel={vi.fn()} onSaved={onSaved} />);

    fireEvent.click(screen.getByText("calendar.systems.form.createButton"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "common.fieldErrors.monthNamesCount"
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("warns that years re-label once the anchor year changes (§5.2)", () => {
    render(
      <DateSystemForm
        system={humanCountFixture}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(
      screen.queryByText("calendar.systems.form.anchorWarning")
    ).not.toBeInTheDocument();

    type(field("anchorYear"), "6000");

    expect(screen.getByRole("status")).toHaveTextContent(
      "calendar.systems.form.anchorWarning"
    );
  });

  it("edits one of the DM's systems by id", async () => {
    updateDateSystem.mockResolvedValue({ ok: true });
    render(
      <DateSystemForm
        system={humanCountFixture}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    type(field("anchorYear"), "6000");
    fireEvent.click(screen.getByText("common.form.save"));

    await waitFor(() =>
      expect(updateDateSystem).toHaveBeenCalledWith({
        ...humanCountInputFixture,
        anchorYear: 6000,
        id: humanCountFixture.id,
      })
    );
  });

  it("offers the universal count only its names, never an anchor", async () => {
    updateUniversalDateSystem.mockResolvedValue({ ok: true });
    render(
      <DateSystemForm
        system={universalCountFixture}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(
      screen.queryByLabelText("calendar.systems.fields.anchorYear")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("calendar.systems.fields.beforeLabel")
    ).not.toBeInTheDocument();

    type(field("name"), "Dall'alba");
    fireEvent.click(screen.getByText("common.form.save"));

    await waitFor(() =>
      expect(updateUniversalDateSystem).toHaveBeenCalledWith({
        name: "Dall'alba",
        afterLabel: universalCountFixture.afterLabel,
        afterAbbrev: universalCountFixture.afterAbbrev,
        monthNames: universalCountFixture.monthNames,
        weekdayNames: universalCountFixture.weekdayNames,
      })
    );
    expect(updateDateSystem).not.toHaveBeenCalled();
  });
});
