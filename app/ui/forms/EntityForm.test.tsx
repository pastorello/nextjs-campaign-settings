import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EntityForm from "./EntityForm";
import PageType from "@/app/lib/definitions/types/PageType";
import MutationResult from "@/app/lib/definitions/types/MutationResult";

interface StubSpell {
  id?: number;
  name: string;
}

const copy = {
  createTitle: "New spell",
  editTitle: "Edit spell",
  createButton: "Create",
  editButton: "Save",
};

describe("EntityForm", () => {
  it("shows the create title and button in create mode", () => {
    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        mutations={{
          create: vi.fn(),
          update: vi.fn(),
        }}
        copy={copy}
        onCancel={vi.fn()}
        onSaveFinished={vi.fn()}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    expect(screen.getByText("New spell")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("shows the edit title and button in edit mode", () => {
    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        formData={{ id: 1, name: "Fireball" }}
        mutations={{ create: vi.fn(), update: vi.fn() }}
        copy={copy}
        onCancel={vi.fn()}
        onSaveFinished={vi.fn()}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    expect(screen.getByText("Edit spell")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders the field layout supplied by children", () => {
    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        formData={{ id: 1, name: "Fireball" }}
        mutations={{ create: vi.fn(), update: vi.fn() }}
        copy={copy}
        onCancel={vi.fn()}
        onSaveFinished={vi.fn()}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    expect(screen.getByRole("textbox")).toHaveValue("Fireball");
  });

  it("keeps the submit button disabled until a field is edited", () => {
    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        formData={{ id: 1, name: "Fireball" }}
        mutations={{ create: vi.fn(), update: vi.fn() }}
        copy={copy}
        onCancel={vi.fn()}
        onSaveFinished={vi.fn()}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    expect(screen.getByText("Save").closest("button")).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Ice Storm" },
    });

    expect(screen.getByText("Save").closest("button")).toBeEnabled();
  });

  it("submit stays enabled from the start when disableUntilEdited is false", () => {
    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        mutations={{ create: vi.fn(), update: vi.fn() }}
        copy={copy}
        onCancel={vi.fn()}
        onSaveFinished={vi.fn()}
        disableUntilEdited={false}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    expect(screen.getByText("Create").closest("button")).toBeEnabled();
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        mutations={{ create: vi.fn(), update: vi.fn() }}
        copy={copy}
        onCancel={onCancel}
        onSaveFinished={vi.fn()}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    fireEvent.click(screen.getByText("cancel"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("calls create with the full page on submit in create mode", async () => {
    const create = vi.fn<(page: StubSpell) => Promise<MutationResult>>(() =>
      Promise.resolve({ ok: true })
    );
    const onSaveFinished = vi.fn();

    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        mutations={{ create, update: vi.fn() }}
        copy={copy}
        onCancel={vi.fn()}
        onSaveFinished={onSaveFinished}
        disableUntilEdited={false}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Ice Storm" },
    });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0]?.[0]).toMatchObject({ name: "Ice Storm" });
    await waitFor(() => expect(onSaveFinished).toHaveBeenCalled());
  });

  it("calls update with only the edited fields plus id on submit in edit mode", async () => {
    const update = vi.fn<(page: StubSpell) => Promise<MutationResult>>(() =>
      Promise.resolve({ ok: true })
    );

    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        formData={{ id: 42, name: "Fireball" }}
        mutations={{ create: vi.fn(), update }}
        copy={copy}
        onCancel={vi.fn()}
        onSaveFinished={vi.fn()}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Ice Storm" },
    });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0]?.[0]).toEqual({ id: 42, name: "Ice Storm" });
  });

  it("shows field errors and does not call onSaveFinished when the mutation fails", async () => {
    const create = vi.fn<(page: StubSpell) => Promise<MutationResult>>(() =>
      Promise.resolve({ ok: false, errors: { name: ["is required"] } })
    );
    const onSaveFinished = vi.fn();

    render(
      <EntityForm<StubSpell>
        pageType={PageType.Spell}
        mutations={{ create, update: vi.fn() }}
        copy={copy}
        onCancel={vi.fn()}
        onSaveFinished={onSaveFinished}
        disableUntilEdited={false}
      >
        {(field) => <div>{field("name")}</div>}
      </EntityForm>
    );

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(onSaveFinished).not.toHaveBeenCalled();
  });
});
