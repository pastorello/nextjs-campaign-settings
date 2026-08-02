import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageForm from "./PageForm";

describe("PageForm", () => {
  it("renders save mode when children are given", () => {
    render(
      <PageForm onCancel={vi.fn()} onSaveFinished={vi.fn()} hasEdits>
        <div>field</div>
      </PageForm>
    );

    expect(screen.getByText("field")).toBeInTheDocument();
    expect(screen.getByText("save")).toBeInTheDocument();
  });

  it("renders delete mode when there are no children", () => {
    render(<PageForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    expect(screen.getByText("delete")).toBeInTheDocument();
  });

  it("disables the save button until there are edits", () => {
    render(
      <PageForm onCancel={vi.fn()} onSaveFinished={vi.fn()} hasEdits={false}>
        <div>field</div>
      </PageForm>
    );

    expect(screen.getByText("save").closest("button")).toBeDisabled();
  });

  it("enables the save button once there are edits", () => {
    render(
      <PageForm onCancel={vi.fn()} onSaveFinished={vi.fn()} hasEdits>
        <div>field</div>
      </PageForm>
    );

    expect(screen.getByText("save").closest("button")).toBeEnabled();
  });

  it("the delete button is always enabled, even without hasEdits", () => {
    render(<PageForm onCancel={vi.fn()} onSaveFinished={vi.fn()} />);

    expect(screen.getByText("delete").closest("button")).toBeEnabled();
  });

  it("shows saving copy and disables cancel while isSaving", () => {
    render(
      <PageForm onCancel={vi.fn()} onSaveFinished={vi.fn()} hasEdits isSaving>
        <div>field</div>
      </PageForm>
    );

    expect(screen.getByText("saving")).toBeInTheDocument();
    expect(screen.getByText("cancel").closest("button")).toBeDisabled();
  });

  it("calls onSaveFinished when the save button is clicked", () => {
    const onSaveFinished = vi.fn();
    render(
      <PageForm onCancel={vi.fn()} onSaveFinished={onSaveFinished} hasEdits>
        <div>field</div>
      </PageForm>
    );

    fireEvent.click(screen.getByText("save"));

    expect(onSaveFinished).toHaveBeenCalled();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <PageForm onCancel={onCancel} onSaveFinished={vi.fn()} hasEdits>
        <div>field</div>
      </PageForm>
    );

    fireEvent.click(screen.getByText("cancel"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("shows the error message when lastError is set", () => {
    render(
      <PageForm
        onCancel={vi.fn()}
        onSaveFinished={vi.fn()}
        hasEdits
        lastError={{ message: "boom" }}
      >
        <div>field</div>
      </PageForm>
    );

    expect(screen.getByText("errorPrefix")).toBeInTheDocument();
  });

  it("shows no error message when lastError is unset", () => {
    render(
      <PageForm onCancel={vi.fn()} onSaveFinished={vi.fn()} hasEdits>
        <div>field</div>
      </PageForm>
    );

    expect(screen.queryByText("errorPrefix")).not.toBeInTheDocument();
  });
});
