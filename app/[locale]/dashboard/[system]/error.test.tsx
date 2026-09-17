import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DatabaseUnreachableError from "@/app/lib/errors/DatabaseUnreachableError";
import ErrorBoundary from "./error";

describe("dashboard Error boundary", () => {
  it("shows the generic copy for an ordinary error", () => {
    const error = new Error("Something exploded");
    render(<ErrorBoundary error={error} reset={vi.fn()} />);

    expect(screen.getByText("genericTitle")).toBeInTheDocument();
    expect(screen.getByText("genericBody")).toBeInTheDocument();
    expect(screen.queryByText("unreachableTitle")).not.toBeInTheDocument();
  });

  it("shows the unreachable-specific copy when the message carries the prefix", () => {
    const error = new Error(
      `${DatabaseUnreachableError.PREFIX}: connection refused`
    );
    render(<ErrorBoundary error={error} reset={vi.fn()} />);

    expect(screen.getByText("unreachableTitle")).toBeInTheDocument();
    expect(screen.getByText("unreachableBody")).toBeInTheDocument();
  });

  it("logs the error to the console on mount", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const error = new Error("boom");
    render(<ErrorBoundary error={error} reset={vi.fn()} />);

    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });

  it("calls reset when the retry button is clicked", () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByText("retry"));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
