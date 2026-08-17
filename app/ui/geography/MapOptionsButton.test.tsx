import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MapOptionsButton from "./MapOptionsButton";

describe("MapOptionsButton (usability fix, 2026-08-17)", () => {
  it("shows nothing but the trigger until clicked", () => {
    render(
      <MapOptionsButton
        hasMap
        isRoot={false}
        onReplaceMap={vi.fn()}
        onDeleteMap={vi.fn()}
      />
    );

    expect(screen.queryByText("replaceSubmit")).not.toBeInTheDocument();
    expect(screen.queryByText("trigger")).not.toBeInTheDocument();
  });

  it("shows replace-map wording when the place already has a map", () => {
    render(
      <MapOptionsButton
        hasMap
        isRoot={false}
        onReplaceMap={vi.fn()}
        onDeleteMap={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "trigger" }));

    expect(screen.getByText("replaceSubmit")).toBeInTheDocument();
    expect(screen.queryByText("uploadSubmit")).not.toBeInTheDocument();
  });

  it("shows upload-map wording when the place has none yet", () => {
    render(
      <MapOptionsButton
        hasMap={false}
        isRoot={false}
        onReplaceMap={vi.fn()}
        onDeleteMap={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "trigger" }));

    expect(screen.getByText("uploadSubmit")).toBeInTheDocument();
  });

  it("calls onReplaceMap and closes the menu", () => {
    const onReplaceMap = vi.fn();
    render(
      <MapOptionsButton
        hasMap
        isRoot={false}
        onReplaceMap={onReplaceMap}
        onDeleteMap={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "trigger" }));
    fireEvent.click(screen.getByText("replaceSubmit"));

    expect(onReplaceMap).toHaveBeenCalled();
    expect(screen.queryByText("replaceSubmit")).not.toBeInTheDocument();
  });

  it("offers deleting the map, and calls onDeleteMap", () => {
    const onDeleteMap = vi.fn();
    render(
      <MapOptionsButton
        hasMap
        isRoot={false}
        onReplaceMap={vi.fn()}
        onDeleteMap={onDeleteMap}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "trigger" }));
    fireEvent.click(screen.getByText("trigger"));

    expect(onDeleteMap).toHaveBeenCalled();
  });

  it("does not offer deleting the map for the root (rule 1, SPEC-010)", () => {
    render(
      <MapOptionsButton
        hasMap
        isRoot={true}
        onReplaceMap={vi.fn()}
        onDeleteMap={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "trigger" }));

    expect(screen.queryByText("trigger")).not.toBeInTheDocument();
  });
});
