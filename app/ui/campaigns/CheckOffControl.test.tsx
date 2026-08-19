import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const notifyError = vi.fn<(...args: unknown[]) => void>();
vi.mock("@/app/lib/notifications/notify", () => ({
  notifyError: (...args: unknown[]) => notifyError(...args),
}));

import CheckOffControl from "./CheckOffControl";

describe("CheckOffControl (SPEC-013 §5.7, T9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders unchecked/checked from the `checked` prop", () => {
    const { rerender } = render(
      <CheckOffControl
        label="Assegnato"
        checked={false}
        onToggle={vi.fn()}
        errorMessage="failed"
      />
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "false"
    );

    rerender(
      <CheckOffControl
        label="Assegnato"
        checked={true}
        onToggle={vi.fn()}
        errorMessage="failed"
      />
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("calls onToggle with the next state on click and refreshes", async () => {
    const onToggle = vi.fn().mockResolvedValue({ ok: true });
    render(
      <CheckOffControl
        label="Assegnato"
        checked={false}
        onToggle={onToggle}
        errorMessage="failed"
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(true));
    expect(refresh).toHaveBeenCalled();
  });

  it("is operable by keyboard alone — Space toggles it", async () => {
    const onToggle = vi.fn().mockResolvedValue({ ok: true });
    render(
      <CheckOffControl
        label="Trovato"
        checked={false}
        onToggle={onToggle}
        errorMessage="failed"
      />
    );

    const checkbox = screen.getByRole("checkbox");
    checkbox.focus();
    expect(checkbox).toHaveFocus();
    fireEvent.keyUp(checkbox, { key: " " });

    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(true));
  });

  it("is driven by the `checked` prop, not local state — proves the reload path works", async () => {
    // The control never flips itself; only a re-render carrying the server's
    // updated `checked` prop (what `router.refresh()`, and a real reload,
    // both produce) changes what it shows. If it kept its own state instead,
    // a reload could show stale UI even though the server persisted the flag.
    const onToggle = vi.fn().mockResolvedValue({ ok: true });
    const { rerender } = render(
      <CheckOffControl
        label="Trovato"
        checked={false}
        onToggle={onToggle}
        errorMessage="failed"
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(true));
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "false"
    );

    rerender(
      <CheckOffControl
        label="Trovato"
        checked={true}
        onToggle={onToggle}
        errorMessage="failed"
      />
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("notifies an error and does not refresh when the mutation fails", async () => {
    const onToggle = vi.fn().mockResolvedValue({ ok: false, errors: {} });
    render(
      <CheckOffControl
        label="Assegnato"
        checked={false}
        onToggle={onToggle}
        errorMessage="check-off failed"
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("check-off failed")
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
