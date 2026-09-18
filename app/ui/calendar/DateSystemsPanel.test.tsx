import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  humanCountFixture,
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

const deleteDateSystemById = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/deleteDateSystemById", () => ({
  default: (...args: unknown[]) => deleteDateSystemById(...args),
}));

const setDefaultDateSystem = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/calendar/setDefaultDateSystem", () => ({
  default: (...args: unknown[]) => setDefaultDateSystem(...args),
}));

const notifySuccess = vi.fn<(...args: unknown[]) => void>();
const notifyError = vi.fn<(...args: unknown[]) => void>();
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: (...args: unknown[]) => notifySuccess(...args),
  notifyError: (...args: unknown[]) => notifyError(...args),
}));

vi.mock("./DateSystemForm", () => ({
  default: ({ system }: { system?: { name: string } }) => (
    <div data-testid="date-system-form">{system?.name ?? "new"}</div>
  ),
}));

import DateSystemsPanel from "./DateSystemsPanel";

const rowOf = (name: string) =>
  screen.getByText(name, { selector: "span" }).closest("li")!;

describe("DateSystemsPanel (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the universal count first and marks the default", () => {
    render(
      <DateSystemsPanel systems={[universalCountFixture, humanCountFixture]} />
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent(universalCountFixture.name);
    expect(items[0]).toHaveTextContent("calendar.systems.universalBadge");
    expect(items[0]).toHaveTextContent("calendar.systems.defaultBadge");
    expect(items[1]).not.toHaveTextContent("calendar.systems.defaultBadge");
  });

  it("offers no delete on the universal count or the default", () => {
    const humanDefault = { ...humanCountFixture, isDefault: true };
    const universal = { ...universalCountFixture, isDefault: false };
    render(<DateSystemsPanel systems={[universal, humanDefault]} />);

    expect(
      within(rowOf(universal.name)).queryByText("common.form.delete")
    ).not.toBeInTheDocument();
    expect(
      within(rowOf(humanDefault.name)).queryByText("common.form.delete")
    ).not.toBeInTheDocument();
    // The default's row offers no "make default" either; the universal one does.
    expect(
      within(rowOf(universal.name)).getByText(
        "calendar.systems.setDefaultButton"
      )
    ).toBeInTheDocument();
    expect(
      within(rowOf(humanDefault.name)).queryByText(
        "calendar.systems.setDefaultButton"
      )
    ).not.toBeInTheDocument();
  });

  it("invites adding a system when only the universal count exists", () => {
    render(<DateSystemsPanel systems={[universalCountFixture]} />);

    expect(screen.getByText("calendar.systems.empty")).toBeInTheDocument();
  });

  it("makes a system the default and refreshes", async () => {
    setDefaultDateSystem.mockResolvedValue({ ok: true });
    render(
      <DateSystemsPanel systems={[universalCountFixture, humanCountFixture]} />
    );

    fireEvent.click(
      within(rowOf(humanCountFixture.name)).getByText(
        "calendar.systems.setDefaultButton"
      )
    );

    await waitFor(() => expect(setDefaultDateSystem).toHaveBeenCalledWith(2));
    expect(refresh).toHaveBeenCalled();
    expect(notifySuccess).toHaveBeenCalled();
  });

  it("deletes a system after confirmation and refreshes", async () => {
    deleteDateSystemById.mockResolvedValue({ ok: true });
    render(
      <DateSystemsPanel systems={[universalCountFixture, humanCountFixture]} />
    );

    fireEvent.click(
      within(rowOf(humanCountFixture.name)).getByText("common.form.delete")
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("common.form.delete"));

    await waitFor(() => expect(deleteDateSystemById).toHaveBeenCalledWith(2));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows a refused delete from its field-error key, without refreshing", async () => {
    deleteDateSystemById.mockResolvedValue({
      ok: false,
      errors: { id: [{ key: "defaultDateSystemUndeletable" }] },
    });
    render(
      <DateSystemsPanel systems={[universalCountFixture, humanCountFixture]} />
    );

    fireEvent.click(
      within(rowOf(humanCountFixture.name)).getByText("common.form.delete")
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByText("common.form.delete")
    );

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        expect.stringContaining(
          "common.fieldErrors.defaultDateSystemUndeletable"
        )
      )
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("opens the edit form in place of a row", () => {
    render(
      <DateSystemsPanel systems={[universalCountFixture, humanCountFixture]} />
    );

    fireEvent.click(
      within(rowOf(humanCountFixture.name)).getByText("common.table.edit")
    );

    expect(screen.getByTestId("date-system-form")).toHaveTextContent(
      humanCountFixture.name
    );
  });
});
