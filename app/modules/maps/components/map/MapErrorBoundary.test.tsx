import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapErrorBoundary } from "./MapErrorBoundary";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) =>
    `${namespace}.${key}`,
}));

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) {
    throw new Error("kaboom");
  }
  return <div>safe content</div>;
}

function StacklessBomb(): never {
  const error = new Error("no stack here");
  delete (error as { stack?: string }).stack;
  throw error;
}

describe("MapErrorBoundary", () => {
  beforeEach(() => {
    shouldThrow = true;
    // React logs the caught error to console.error; keep test output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the fallback UI when a child throws", () => {
    render(
      <MapErrorBoundary>
        <Bomb />
      </MapErrorBoundary>
    );

    expect(
      screen.getByText("geography.errorBoundary.title")
    ).toBeInTheDocument();
    expect(screen.queryByText("safe content")).not.toBeInTheDocument();
  });

  it("shows the translated strings, not the old hardcoded English copy", () => {
    render(
      <MapErrorBoundary>
        <Bomb />
      </MapErrorBoundary>
    );

    expect(
      screen.getByText("geography.errorBoundary.title")
    ).toBeInTheDocument();
    expect(
      screen.getByText("geography.errorBoundary.tryAgain")
    ).toBeInTheDocument();
    expect(
      screen.getByText("geography.errorBoundary.goHome")
    ).toBeInTheDocument();
    expect(
      screen.getByText("geography.errorBoundary.technicalDetails")
    ).toBeInTheDocument();

    expect(screen.queryByText("Map Error")).not.toBeInTheDocument();
    expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    expect(screen.queryByText("Go Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Technical Details")).not.toBeInTheDocument();
  });

  it("resets and re-renders the children when Try Again is clicked", () => {
    render(
      <MapErrorBoundary>
        <Bomb />
      </MapErrorBoundary>
    );

    shouldThrow = false;
    fireEvent.click(screen.getByText("geography.errorBoundary.tryAgain"));

    expect(screen.getByText("safe content")).toBeInTheDocument();
    expect(
      screen.queryByText("geography.errorBoundary.title")
    ).not.toBeInTheDocument();
  });

  it("shows the error's stack trace in the technical details", () => {
    render(
      <MapErrorBoundary>
        <Bomb />
      </MapErrorBoundary>
    );

    const details = screen
      .getByText("geography.errorBoundary.technicalDetails")
      .closest("details");
    expect(details).not.toBeNull();
    expect(details!.textContent).toContain("kaboom");
  });

  // TD-106: the lint rule `no-location-assign-relative-destination` wants this
  // button to be a `useRouter().push()`. It must not become one — the point of
  // "Vai alla home" is to discard the client state the Leaflet crash happened
  // in, which a soft navigation would carry across. This test fails if someone
  // swaps it for a router push.
  it("leaves the page with a full document load, not a client-side navigation", () => {
    const originalLocation = window.location;
    const stub = { href: "" };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: stub,
    });

    try {
      render(
        <MapErrorBoundary>
          <Bomb />
        </MapErrorBoundary>
      );

      fireEvent.click(screen.getByText("geography.errorBoundary.goHome"));

      expect(stub.href).toBe("/");
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it("falls back to the translated no-stack-trace copy when the error has no stack", () => {
    render(
      <MapErrorBoundary>
        <StacklessBomb />
      </MapErrorBoundary>
    );

    expect(
      screen.getByText("geography.errorBoundary.noStackTrace")
    ).toBeInTheDocument();
  });
});
