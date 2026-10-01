import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh }) }));
const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: notify.success,
  notifyError: notify.error,
}));
// The confirm dialog renders its own buttons; the stub confirms at once.
vi.mock("@/app/ui/components/Modal", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/app/ui/forms/PageForm", () => ({
  default: ({ onSaveFinished }: { onSaveFinished: () => void }) => (
    <button onClick={onSaveFinished}>confirm</button>
  ),
}));

import InlineOrderedList from "./InlineOrderedList";

const items = [
  { id: 1, name: "First" },
  { id: 2, name: "Second" },
];
const reorder = vi.fn();
const remove = vi.fn();

function renderList() {
  render(
    <InlineOrderedList
      items={items}
      copy={{
        title: "Rows",
        addButton: "Add row",
        moveUp: (name) => `up ${name}`,
        moveDown: (name) => `down ${name}`,
      }}
      renderItem={(item) => <span>{item.name}</span>}
      renderForm={(item, onDone) => (
        <button onClick={onDone}>{item ? `edit ${item.name}` : "new"}</button>
      )}
      reorder={reorder}
      remove={remove}
    />
  );
}

describe("InlineOrderedList (SPEC-028 §9 decision 6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reorder.mockResolvedValue({ ok: true });
    remove.mockResolvedValue({ ok: true });
  });

  it("lists the rows under their heading, the ends unmovable", () => {
    renderList();

    expect(screen.getByRole("region", { name: "Rows" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "up First" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "down Second" })).toBeDisabled();
  });

  it("opens an empty form to add, and the row's own to edit", () => {
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "Add row" }));
    fireEvent.click(screen.getByRole("button", { name: "new" }));
    expect(screen.queryByRole("button", { name: "new" })).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: 'common.table.editItem {"name":"Second"}',
      })
    );
    expect(
      screen.getByRole("button", { name: "edit Second" })
    ).toBeInTheDocument();
  });

  it("moves a row by sending the whole new order", async () => {
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "down First" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(reorder).toHaveBeenCalledWith([2, 1]);
  });

  it("says when a move is refused", async () => {
    reorder.mockResolvedValue({ ok: false, errors: {} });
    renderList();

    fireEvent.click(screen.getByRole("button", { name: "up Second" }));

    await waitFor(() =>
      expect(notify.error).toHaveBeenCalledWith("common.reorder.failed")
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("deletes a row once confirmed", async () => {
    renderList();

    fireEvent.click(
      screen.getByRole("button", {
        name: 'common.table.deleteItem {"name":"First"}',
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith(1));
    expect(notify.success).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });
});
