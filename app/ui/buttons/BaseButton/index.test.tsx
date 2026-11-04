import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BaseButton from "./index";
import ButtonState from "./ButtonState";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// TD-134: a filter chip only ever gained a background colour when selected —
// aria-pressed stayed unset, so a screen reader user had no way to tell which
// chip was active. `isToggle` opts a button into that mapping; plain action
// buttons (save, delete, ...) never set it, and must not gain aria-pressed
// as a side effect of an unrelated buttonState (e.g. Loading).
describe("BaseButton — aria-pressed (TD-134)", () => {
  it("sets no aria-pressed by default, even when buttonState is Active", () => {
    render(
      <BaseButton onClick={vi.fn()} buttonState={ButtonState.Active}>
        Bard
      </BaseButton>
    );

    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
  });

  it("reflects ButtonState.Active as aria-pressed=true on a toggle button", () => {
    render(
      <BaseButton onClick={vi.fn()} buttonState={ButtonState.Active} isToggle>
        Bard
      </BaseButton>
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("reflects ButtonState.Default as aria-pressed=false on a toggle button", () => {
    render(
      <BaseButton onClick={vi.fn()} buttonState={ButtonState.Default} isToggle>
        Bard
      </BaseButton>
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("does not mark a loading toggle button as pressed", () => {
    render(
      <BaseButton onClick={vi.fn()} buttonState={ButtonState.Loading} isToggle>
        Bard
      </BaseButton>
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("applies the same mapping to a submit (no-onClick) toggle button", () => {
    render(
      <BaseButton buttonState={ButtonState.Active} isToggle>
        Bard
      </BaseButton>
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("applies the same mapping to a link-rendered toggle button", () => {
    render(
      <BaseButton to="/spells" buttonState={ButtonState.Active} isToggle>
        Bard
      </BaseButton>
    );

    expect(screen.getByRole("link")).toHaveAttribute("aria-pressed", "true");
  });
});

// SPEC-033 T1: an export is a file response. `next/link` would prefetch it
// and route to it client-side; a download is a plain anchor.
describe("BaseButton — download links (SPEC-033 T1)", () => {
  it("renders a plain anchor that downloads", () => {
    render(
      <BaseButton to="/api/export/spells?id=3" download ariaLabel="Export Aid">
        icon
      </BaseButton>
    );

    const link = screen.getByRole("link", { name: "Export Aid" });
    expect(link).toHaveAttribute("href", "/api/export/spells?id=3");
    expect(link).toHaveAttribute("download");
  });

  it("leaves an ordinary link to next/link, without download", () => {
    render(<BaseButton to="/dashboard">Home</BaseButton>);

    expect(screen.getByRole("link")).not.toHaveAttribute("download");
  });
});
